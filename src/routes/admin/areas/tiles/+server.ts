import { getDb } from '$lib/server/db.js';
import { tilesTable } from '$lib/server/schema';
import { json } from '@sveltejs/kit';
import { and, eq, or } from 'drizzle-orm';

const MAX_SURFACE_IN_SQUARE_METTERS = 400_000_000;

export async function GET({ url }) {
	const rawMinX = url.searchParams.get('min-x');
	const rawMinY = url.searchParams.get('min-y');
	const rawMaxX = url.searchParams.get('max-x');
	const rawMaxY = url.searchParams.get('max-y');

	if (rawMinX === null || rawMinY === null || rawMaxX === null || rawMaxY === null) {
		return new Response(null, { status: 400 });
	}

	const minX = parseFloat(rawMinX);
	const minY = parseFloat(rawMinY);
	const maxX = parseFloat(rawMaxX);
	const maxY = parseFloat(rawMaxY);

	if (
		isNaN(minX) ||
		isNaN(minY) ||
		isNaN(maxX) ||
		isNaN(maxY) ||
		(maxX - minX) * (maxY - minY) > MAX_SURFACE_IN_SQUARE_METTERS
	) {
		return new Response(null, { status: 400 });
	}

	const db = getDb();

	const tilesCoordinatesChunks: ReturnType<typeof and>[][] = [];

	// SQLite error: Expression tree is too large (maximum depth 100)
	for (let x = floorTo1000(minX); x < ceilTo1000(maxX); x += 1000) {
		for (let y = floorTo1000(minY); y < ceilTo1000(maxY); y += 1000) {
			if (tilesCoordinatesChunks.length === 0 || tilesCoordinatesChunks.at(-1)!.length === 50) {
				tilesCoordinatesChunks.push([and(eq(tilesTable.minX, x), eq(tilesTable.minY, y))]);
			} else {
				tilesCoordinatesChunks.at(-1)!.push(and(eq(tilesTable.minX, x), eq(tilesTable.minY, y)));
			}
		}
	}

	const firstChunk = tilesCoordinatesChunks.shift();

	if (firstChunk === undefined) {
		return json([]);
	}

	const batchedTiles = await db.batch([
		db.query.tilesTable.findMany({
			where: or(...firstChunk),
			with: { lidarJob: { columns: { id: true } } }
		}),
		...tilesCoordinatesChunks.map((statement) =>
			db.query.tilesTable.findMany({
				where: or(...statement),
				with: { lidarJob: { columns: { id: true } } }
			})
		)
	]);

	const tiles = batchedTiles.flatMap((s) => s);

	return json(tiles);
}

function floorTo1000(number: number) {
	return Math.floor(number / 1000) * 1000;
}

function ceilTo1000(number: number) {
	return Math.ceil(number / 1000) * 1000;
}

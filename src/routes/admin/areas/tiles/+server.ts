import { TILE_SIZE_IN_METERS } from '$lib/constants';
import { db } from '$lib/server/db.js';
import { tilesTable } from '$lib/server/schema';
import { json } from '@sveltejs/kit';
import { and, gt, lt } from 'drizzle-orm';

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

	const tiles = await db
		.select()
		.from(tilesTable)
		.where(
			and(
				gt(tilesTable.minX, minX - TILE_SIZE_IN_METERS),
				gt(tilesTable.minY, minY - TILE_SIZE_IN_METERS),
				lt(tilesTable.maxX, maxX + TILE_SIZE_IN_METERS),
				lt(tilesTable.maxY, maxY + TILE_SIZE_IN_METERS)
			)
		)
		.all();

	return json(tiles);
}

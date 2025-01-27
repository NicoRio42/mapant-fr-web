import { drizzle } from 'drizzle-orm/libsql';
import tiles from '../../data/tiles.json' with { type: 'json' };
import { tilesTable, type TileInsert } from '../lib/server/schema';
import { env } from 'node:process';

const db = drizzle({ connection: { url: env.TURSO_DB_URL ?? '', authToken: env.TURSO_DB_TOKEN } });

type Tiles = {
	features: {
		properties: {
			nom_pkk: string;
			url_telech: string;
		};
		geometry: {
			coordinates: [
				[[[number, number], [number, number], [number, number], [number, number], [number, number]]]
			];
		};
	}[];
};

type TileToInsertWithId = TileInsert & { id: string };
const tilesToInsertMap: Map<string, TileToInsertWithId> = new Map();

for (const tile of (tiles as Tiles).features) {
	let minX = tile.geometry.coordinates[0][0][0][0];
	let minY = tile.geometry.coordinates[0][0][0][1];
	let maxX = tile.geometry.coordinates[0][0][0][0];
	let maxY = tile.geometry.coordinates[0][0][0][1];

	for (const [x, y] of tile.geometry.coordinates[0][0]) {
		if (x < minX) minX = x;
		if (x > maxX) maxX = x;
		if (y < minY) minY = y;
		if (y > maxY) maxY = y;
	}

	tilesToInsertMap.set(`${Math.round(minX)}_${Math.round(minY)}`, {
		id: `${Math.round(minX)}_${Math.round(minY)}`,
		minX,
		minY,
		maxX,
		maxY,
		lidarFileUrl: tile.properties.url_telech
	});
}

const tilesToInsert = Array.from(tilesToInsertMap.values());

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
	const result: T[][] = [];

	for (let i = 0; i < array.length; i += chunkSize) {
		result.push(array.slice(i, i + chunkSize));
	}

	return result;
}

const chunkedTilesToInsert = chunkArray(tilesToInsert, 1000);

console.log(chunkedTilesToInsert.length);
let index = 1;

for (const chunk of chunkedTilesToInsert) {
	await db.insert(tilesTable).values(chunk).run();
	index++;
}

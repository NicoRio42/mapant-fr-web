import { drizzle } from 'drizzle-orm/libsql';
import tiles from '../../data/tiles.json' with { type: 'json' };
import { tilesTable, type TileInsert } from '../lib/server/schema';

const db = drizzle({ connection: { url: 'file:main.db' } });

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

const tilesToInsert: TileInsert[] = [];

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

	tilesToInsert.push({
		minX,
		minY,
		maxX,
		maxY,
		lidarFileUrl: tile.properties.url_telech
	});
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
	const result: T[][] = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		result.push(array.slice(i, i + chunkSize));
	}
	return result;
}

const chunkedTilesToInsert = chunkArray(tilesToInsert, 1000);

console.log(chunkedTilesToInsert.length);
for (const chunk of chunkedTilesToInsert) {
	console.log(chunk.length);
	await db.insert(tilesTable).values(chunk).run();
}

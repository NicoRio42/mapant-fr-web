import { drizzle } from 'drizzle-orm/libsql';
import { tilesTable, type TileInsert } from '../lib/server/schema';
import { env } from 'node:process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const db = drizzle({ connection: { url: env.TURSO_DB_URL ?? '', authToken: env.TURSO_DB_TOKEN } });

type LidarHdBlocsGeojson = {
	type: string;
	features: Array<{
		type: string;
		id: string;
		geometry: {
			type: string;
			coordinates: Array<Array<Array<Array<number>>>>;
		};
		geometry_name: string;
		properties: {
			name: string;
			area: number;
		};
		bbox: Array<number>;
	}>;
	totalFeatures: number;
	numberMatched: number;
	numberReturned: number;
	timeStamp: string;
	crs: {
		type: string;
		properties: {
			name: string;
		};
	};
	bbox: Array<number>;
};

type LidarHdDalesGeojson = {
	type: string;
	features: Array<{
		type: string;
		id: string;
		geometry: {
			type: string;
			coordinates: Array<Array<Array<number>>>;
		};
		geometry_name: string;
		properties: {
			name: string;
			url: string;
		};
		bbox: Array<number>;
	}>;
	totalFeatures: number;
	numberMatched: number;
	numberReturned: number;
	timeStamp: string;
	crs: {
		type: string;
		properties: {
			name: string;
		};
	};
	bbox: Array<number>;
};

type TileToInsertWithId = TileInsert & { id: string };
const tilesToInsertMap: Map<string, TileToInsertWithId> = new Map();

const nuageBlocUrl =
	'https://data.geopf.fr/private/wfs/?service=WFS&version=2.0.0&apikey=interface_catalogue&request=GetFeature&typeNames=IGNF_LIDAR-HD_TA:nuage-bloc&outputFormat=application/json';

const nuageDalleBaseUrl =
	'https://data.geopf.fr/private/wfs/?service=WFS&version=2.0.0&apikey=interface_catalogue&request=GetFeature&typeNames=IGNF_LIDAR-HD_TA:nuage-dalle&outputFormat=application/json&bbox=';

const nuageBlocResponse: LidarHdBlocsGeojson = await fetch(nuageBlocUrl).then((r) => r.json());

writeFileSync(
	join('src', 'lib', 'components', 'map', 'lidar-hd.json'),
	JSON.stringify(nuageBlocResponse)
);

for (const bloc of nuageBlocResponse.features) {
	console.log(`Fetching bloc ${bloc.properties.name}`);
	const nuageDalleUrl = nuageDalleBaseUrl + bloc.bbox.join(',');
	const nuageBlocResponse: LidarHdDalesGeojson = await fetch(nuageDalleUrl).then((r) => r.json());

	for (const tile of nuageBlocResponse.features) {
		let minX = tile.geometry.coordinates[0][0][0];
		let minY = tile.geometry.coordinates[0][0][1];
		let maxX = tile.geometry.coordinates[0][0][0];
		let maxY = tile.geometry.coordinates[0][0][1];

		for (const [x, y] of tile.geometry.coordinates[0]) {
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
			lidarFileUrl: tile.properties.url
		});
	}
}

const tilesToInsert = Array.from(tilesToInsertMap.values());
console.log(`Number of tiles: ${tilesToInsert.length}`);

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
	const result: T[][] = [];

	for (let i = 0; i < array.length; i += chunkSize) {
		result.push(array.slice(i, i + chunkSize));
	}

	return result;
}

const chunkedTilesToInsert = chunkArray(tilesToInsert, 1000);

let index = 1;

for (const chunk of chunkedTilesToInsert) {
	await db.insert(tilesTable).values(chunk).onConflictDoNothing().run();
	console.log(`Insert batch ${index}`);
	index++;
}

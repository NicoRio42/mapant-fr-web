import { TILE_SIZE_IN_METERS } from '$lib/constants';
import { db } from '$lib/server/db.js';
import {
	lidarStepJobTable,
	mapRenderingStepJobTable,
	tilesTable,
	workersTable,
	type Tile
} from '$lib/server/schema';
import { Scrypt } from '$lib/server/scrypt';
import { eq, inArray } from 'drizzle-orm';
import type { LidarJob, NoJob, RenderJob } from './schemas';

export async function POST({ request }) {
	const authorizationHeader = request.headers.get('Authorization');
	if (authorizationHeader === null || !authorizationHeader.startsWith('Bearer')) {
		return new Response(null, { status: 401 });
	}

	const token = authorizationHeader.split(' ')[1];
	if (!token) return new Response(null, { status: 401 });
	const [workerId, apiKey] = token.split('.');
	if (!workerId || !apiKey) return new Response(null, { status: 401 });

	const worker = await db.select().from(workersTable).where(eq(workersTable.id, workerId)).get();
	if (worker === undefined || !worker.hashedApiKey) return new Response(null, { status: 403 });

	const isApiKeyRight = await new Scrypt().verify(worker.hashedApiKey, apiKey);
	if (!isApiKeyRight) return new Response(null, { status: 403 });

	// TODO: wrap all of this in a transaction

	const nextLidarJob = await db
		.select()
		.from(lidarStepJobTable)
		.innerJoin(tilesTable, eq(lidarStepJobTable.tileId, tilesTable.id))
		.where(eq(tilesTable.lidarStepStatus, 'not-started'))
		.orderBy(lidarStepJobTable.index)
		.limit(1)
		.get();

	if (nextLidarJob !== undefined) {
		await db
			.update(tilesTable)
			.set({ lidarStepStatus: 'ongoing', lidarStepWorkerId: workerId })
			.where(eq(tilesTable.id, nextLidarJob.tiles.id))
			.run();

		return new Response(
			JSON.stringify({
				type: 'Lidar',
				data: {
					x: nextLidarJob.tiles.minX,
					y: nextLidarJob.tiles.minY,
					tile_url: nextLidarJob.tiles.lidarFileUrl
				}
			} satisfies LidarJob),
			{ status: 202 }
		);
	}

	const nextRenderJob = await db
		.select()
		.from(mapRenderingStepJobTable)
		.innerJoin(tilesTable, eq(mapRenderingStepJobTable.tileId, tilesTable.id))
		.where(eq(tilesTable.lidarStepStatus, 'not-started'))
		.orderBy(mapRenderingStepJobTable.index)
		.limit(1)
		.get();

	if (nextRenderJob !== undefined) {
		const neigbhoringLidarJobs = await db
			.select()
			.from(lidarStepJobTable)
			.innerJoin(tilesTable, eq(lidarStepJobTable.tileId, tilesTable.id))
			.where(inArray(tilesTable.id, getNeigbhoringTilesIds(nextRenderJob.tiles)))
			.orderBy(lidarStepJobTable.index)
			.all();

		const someNeigbhoringLidarJobsAreNotFinished = neigbhoringLidarJobs.some(
			(j) => j.tiles.lidarStepStatus !== 'finished'
		);

		if (someNeigbhoringLidarJobsAreNotFinished) {
			return new Response(JSON.stringify({ type: 'NoJobLeft' } satisfies NoJob), {
				status: 202
			});
		}

		await db
			.update(tilesTable)
			.set({ mapRenderingStepStatus: 'ongoing', mapRenderingStepWorkerId: workerId })
			.where(eq(tilesTable.id, nextRenderJob.tiles.id))
			.run();

		return new Response(
			JSON.stringify({
				type: 'Render',
				data: {
					x: nextRenderJob.tiles.minX,
					y: nextRenderJob.tiles.minY
				}
			} satisfies RenderJob),
			{ status: 202 }
		);
	}

	// const nextPyramidJob = await db
	// 	.select()
	// 	.from(pyramidRenderingStepJobTable)
	// 	.where(eq(pyramidRenderingStepJobTable.status, 'not-started'))
	// 	.orderBy(pyramidRenderingStepJobTable.index)
	// 	.limit(1)
	// 	.get();

	// if (nextPyramidJob !== undefined) {
	// 	await db
	// 		.update(pyramidRenderingStepJobTable)
	// 		.set({ status: 'ongoing' })
	// 		.where(eq(pyramidRenderingStepJobTable.id, nextPyramidJob.id))
	// 		.run();

	// 	await db
	// 		.update(areasToGenerateTable)
	// 		.set({ pyramidGenerationStepStatus: 'ongoing' })
	// 		.where(eq(areasToGenerateTable.id, nextPyramidJob.areaToGenerateId))
	// 		.run();

	// 	return new Response(
	// 		JSON.stringify({
	// 			type: 'Pyramid',
	// 			data: {
	// 				x: nextPyramidJob.x,
	// 				y: nextPyramidJob.y,
	// 				z: nextPyramidJob.zoom
	// 			}
	// 		} satisfies PyramidJob),
	// 		{ status: 202 }
	// 	);
	// }

	return new Response(JSON.stringify({ type: 'NoJobLeft' } satisfies NoJob), {
		status: 202
	});
}

function getNeigbhoringTilesIds(tile: Tile): string[] {
	return [
		`${Math.round(tile.minX)}_${Math.round(tile.minY + TILE_SIZE_IN_METERS)}`,
		`${Math.round(tile.minX + TILE_SIZE_IN_METERS)}_${Math.round(tile.minY + TILE_SIZE_IN_METERS)}`,
		`${Math.round(tile.minX + TILE_SIZE_IN_METERS)}_${Math.round(tile.minY)}`,
		`${Math.round(tile.minX + TILE_SIZE_IN_METERS)}_${Math.round(tile.minY - TILE_SIZE_IN_METERS)}`,
		`${Math.round(tile.minX)}_${Math.round(tile.minY - TILE_SIZE_IN_METERS)}`,
		`${Math.round(tile.minX - TILE_SIZE_IN_METERS)}_${Math.round(tile.minY - TILE_SIZE_IN_METERS)}`,
		`${Math.round(tile.minX - TILE_SIZE_IN_METERS)}_${Math.round(tile.minY)}`,
		`${Math.round(tile.minX - TILE_SIZE_IN_METERS)}_${Math.round(tile.minY + TILE_SIZE_IN_METERS)}`
	];
}

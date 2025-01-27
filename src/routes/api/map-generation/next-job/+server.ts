import { MAX_JOB_TIME_IN_SECONDS, TILE_SIZE_IN_METERS } from '$lib/constants';
import { getDb } from '$lib/server/db.js';
import {
	areasToGenerateTable,
	lidarStepJobTable,
	mapRenderingStepJobTable,
	pyramidRenderingStepJobTable,
	tilesTable,
	type Tile
} from '$lib/server/schema';
import { and, eq, inArray, lt, or, sql } from 'drizzle-orm';
import { getWorkerIdOrErrorStatus } from '../utils';
import type { LidarJob, NoJob, PyramidJob, RenderJob } from './schemas';

export async function POST({ request }) {
	const [workerId, errorStatus] = await getWorkerIdOrErrorStatus(request.headers);
	if (errorStatus !== null) return new Response(null, { status: errorStatus });

	const noJobLeftResponse = new Response(JSON.stringify({ type: 'NoJobLeft' } satisfies NoJob), {
		status: 202
	});

	const db = getDb();

	const nextLidarJobWhereClose = or(
		eq(tilesTable.lidarStepStatus, 'not-started'),
		// If a job is ongoing for more than X minutes, it is canceled and reassigned
		and(
			eq(tilesTable.lidarStepStatus, 'ongoing'),
			lt(
				sql`${tilesTable.lidarStepStartTime}`,
				new Date().getTime() - MAX_JOB_TIME_IN_SECONDS * 1000
			)
		)
	);

	const nextLidarJob = await db
		.select()
		.from(lidarStepJobTable)
		.innerJoin(tilesTable, eq(lidarStepJobTable.tileId, tilesTable.id))
		.where(nextLidarJobWhereClose)
		.orderBy(lidarStepJobTable.index)
		.limit(1)
		.get();

	if (nextLidarJob !== undefined) {
		const updatedTiles = await db
			.update(tilesTable)
			.set({
				lidarStepStatus: 'ongoing',
				lidarStepWorkerId: workerId,
				lidarStepStartTime: new Date()
			})
			.where(and(eq(tilesTable.id, nextLidarJob.tiles.id), nextLidarJobWhereClose))
			.returning();

		if (updatedTiles.length !== 0) {
			return new Response(
				JSON.stringify({
					type: 'Lidar',
					data: {
						tile_id: nextLidarJob.tiles.id,
						tile_url: nextLidarJob.tiles.lidarFileUrl
					}
				} satisfies LidarJob),
				{ status: 202 }
			);
		} else return noJobLeftResponse;
	}

	const nextRenderJobWhereClause = or(
		eq(tilesTable.mapRenderingStepStatus, 'not-started'),
		// If a job is ongoing for more than X minutes, it is canceled and reassigned
		and(
			eq(tilesTable.mapRenderingStepStatus, 'ongoing'),
			lt(
				sql`${tilesTable.mapRenderingStepStartTime}`,
				new Date().getTime() - MAX_JOB_TIME_IN_SECONDS * 1000
			)
		)
	);

	const nextRenderJobs = await db
		.select()
		.from(mapRenderingStepJobTable)
		.innerJoin(tilesTable, eq(mapRenderingStepJobTable.tileId, tilesTable.id))
		.where(nextRenderJobWhereClause)
		.orderBy(mapRenderingStepJobTable.index)
		.limit(5)
		.all();

	if (nextRenderJobs.length !== 0) {
		let nextRenderJob: (typeof nextRenderJobs)[number] | undefined = undefined;
		let neigbhoringTilesIds: string[] | undefined = undefined;

		for (const job of nextRenderJobs) {
			const neigbhoringLidarJobs = await db
				.select()
				.from(lidarStepJobTable)
				.innerJoin(tilesTable, eq(lidarStepJobTable.tileId, tilesTable.id))
				.where(inArray(tilesTable.id, getNeigbhoringTilesIds(job.tiles)))
				.orderBy(lidarStepJobTable.index)
				.all();

			const everyNeigbhoringLidarJobsAreFinished = neigbhoringLidarJobs.every(
				(j) => j.tiles.lidarStepStatus === 'finished'
			);

			if (everyNeigbhoringLidarJobsAreFinished) {
				nextRenderJob = job;
				neigbhoringTilesIds = neigbhoringLidarJobs.map(({ tiles }) => tiles.id);
				break;
			}
		}

		if (nextRenderJob === undefined || neigbhoringTilesIds === undefined) {
			return noJobLeftResponse;
		}

		const updatedTiles = await db
			.update(tilesTable)
			.set({
				mapRenderingStepStatus: 'ongoing',
				mapRenderingStepWorkerId: workerId,
				mapRenderingStepStartTime: new Date()
			})
			.where(and(eq(tilesTable.id, nextRenderJob.tiles.id), nextRenderJobWhereClause))
			.returning();

		if (updatedTiles.length !== 0) {
			return new Response(
				JSON.stringify({
					type: 'Render',
					data: {
						tile_id: nextRenderJob.tiles.id,
						neigbhoring_tiles_ids: neigbhoringTilesIds
					}
				} satisfies RenderJob),
				{ status: 202 }
			);
		} else return noJobLeftResponse;
	}

	const pyramidJobWhereClause = or(
		eq(pyramidRenderingStepJobTable.status, 'not-started'),
		// If a job is ongoing for more than X minutes, it is canceled and reassigned
		and(
			eq(pyramidRenderingStepJobTable.status, 'ongoing'),
			lt(
				sql`${pyramidRenderingStepJobTable.startTime}`,
				new Date().getTime() - MAX_JOB_TIME_IN_SECONDS * 1000
			)
		)
	);

	const nextPyramidJob = await db
		.select()
		.from(pyramidRenderingStepJobTable)
		.where(pyramidJobWhereClause)
		.orderBy(pyramidRenderingStepJobTable.index)
		.limit(1)
		.get();

	if (nextPyramidJob !== undefined) {
		if (nextPyramidJob.baseZoomLevelTileId === null) {
			// Check if the four tiles needed to generate the tile are already generated
			const childPyramidJobs = await db
				.select()
				.from(pyramidRenderingStepJobTable)
				.where(
					and(
						eq(pyramidRenderingStepJobTable.areaToGenerateId, nextPyramidJob.areaToGenerateId),
						eq(pyramidRenderingStepJobTable.zoom, nextPyramidJob.zoom + 1),
						or(
							and(
								eq(pyramidRenderingStepJobTable.x, nextPyramidJob.x * 2),
								eq(pyramidRenderingStepJobTable.y, nextPyramidJob.y * 2)
							),
							and(
								eq(pyramidRenderingStepJobTable.x, nextPyramidJob.x * 2 + 1),
								eq(pyramidRenderingStepJobTable.y, nextPyramidJob.y * 2)
							),
							and(
								eq(pyramidRenderingStepJobTable.x, nextPyramidJob.x * 2),
								eq(pyramidRenderingStepJobTable.y, nextPyramidJob.y * 2 + 1)
							),
							and(
								eq(pyramidRenderingStepJobTable.x, nextPyramidJob.x * 2 + 1),
								eq(pyramidRenderingStepJobTable.y, nextPyramidJob.y * 2 + 1)
							)
						)
					)
				)
				.all();

			if (childPyramidJobs.some((job) => job.status !== 'finished')) {
				return noJobLeftResponse;
			}
		}

		const updatedPyramidJobs = await db
			.update(pyramidRenderingStepJobTable)
			.set({ status: 'ongoing', workerId, startTime: new Date() })
			.where(and(eq(pyramidRenderingStepJobTable.id, nextPyramidJob.id), pyramidJobWhereClause))
			.returning();

		if (updatedPyramidJobs.length !== 0) {
			await db
				.update(areasToGenerateTable)
				.set({ pyramidGenerationStepStatus: 'ongoing' })
				.where(eq(areasToGenerateTable.id, nextPyramidJob.areaToGenerateId))
				.run();

			return new Response(
				JSON.stringify({
					type: 'Pyramid',
					data: {
						x: nextPyramidJob.x,
						y: nextPyramidJob.y,
						z: nextPyramidJob.zoom,
						base_zoom_level_tile_id: nextPyramidJob.baseZoomLevelTileId,
						area_id: nextPyramidJob.areaToGenerateId
					}
				} satisfies PyramidJob),
				{ status: 202 }
			);
		} else return noJobLeftResponse;
	}

	return noJobLeftResponse;
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

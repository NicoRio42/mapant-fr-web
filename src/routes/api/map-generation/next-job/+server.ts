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
import { and, eq, inArray, lt, notExists, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { getWorkerIdOrErrorStatus } from '../utils';
import type { LidarJob, NoJob, PyramidJob, RenderJob } from './schemas';

const JOBS_LIMIT = 16;

export async function POST({ request }) {
	const [workerId, errorStatus] = await getWorkerIdOrErrorStatus(request.headers);
	if (errorStatus !== null) return new Response(null, { status: errorStatus });

	const noJobLeftResponse = new Response(JSON.stringify({ type: 'noJobLeft' } satisfies NoJob), {
		status: 202
	});

	const db = getDb();

	const [nextLidarJob] = await db
		.update(tilesTable)
		.set({
			lidarStepStatus: 'ongoing',
			lidarStepWorkerId: workerId,
			lidarStepStartTime: new Date()
		})
		.where(
			inArray(
				tilesTable.id,
				db
					.select({ data: tilesTable.id })
					.from(tilesTable)
					.innerJoin(lidarStepJobTable, eq(lidarStepJobTable.tileId, tilesTable.id))
					.where(
						or(
							eq(tilesTable.lidarStepStatus, 'not-started'),
							// If a job is ongoing for more than X minutes, it is canceled and reassigned
							and(
								eq(tilesTable.lidarStepStatus, 'ongoing'),
								lt(
									sql`${tilesTable.lidarStepStartTime}`,
									new Date().getTime() - MAX_JOB_TIME_IN_SECONDS * 1000
								)
							)
						)
					)
					.limit(1)
			)
		)
		.returning();

	if (nextLidarJob !== undefined) {
		return new Response(
			JSON.stringify({
				type: 'lidar',
				data: {
					tileId: nextLidarJob.id,
					tileUrl: nextLidarJob.lidarFileUrl
				}
			} satisfies LidarJob),
			{ status: 202 }
		);
	}

	const neighboringTiles = alias(tilesTable, 'neighboring_tile');

	const [nextRenderJob] = await db
		.update(tilesTable)
		.set({
			mapRenderingStepStatus: 'ongoing',
			mapRenderingStepWorkerId: workerId,
			mapRenderingStepStartTime: new Date()
		})
		.where(
			inArray(
				tilesTable.id,
				db
					.select({ data: tilesTable.id })
					.from(tilesTable)
					.innerJoin(mapRenderingStepJobTable, eq(mapRenderingStepJobTable.tileId, tilesTable.id))
					.where(
						and(
							or(
								eq(tilesTable.mapRenderingStepStatus, 'not-started'),
								// If a job is ongoing for more than X minutes, it is canceled and reassigned
								and(
									eq(tilesTable.mapRenderingStepStatus, 'ongoing'),
									lt(
										sql`${tilesTable.mapRenderingStepStartTime}`,
										new Date().getTime() - MAX_JOB_TIME_IN_SECONDS * 1000
									)
								)
							),
							eq(tilesTable.lidarStepStatus, 'finished'),
							// Checks that all neighboring tiles (minX and minY +- 1000) have their lidarStepStatus equal to 'finished'
							notExists(
								db
									.select()
									.from(neighboringTiles)
									.where(
										and(
											eq(neighboringTiles.lidarStepStatus, 'finished'),
											or(
												and(
													eq(neighboringTiles.minX, sql`${tilesTable.minX} - ${TILE_SIZE_IN_METERS}`),
													eq(neighboringTiles.minY, sql`${tilesTable.minY} - ${TILE_SIZE_IN_METERS}`)
												),
												and(
													eq(neighboringTiles.minX, tilesTable.minX),
													eq(neighboringTiles.minY, sql`${tilesTable.minY} - ${TILE_SIZE_IN_METERS}`)
												),
												and(
													eq(neighboringTiles.minX, sql`${tilesTable.minX} + ${TILE_SIZE_IN_METERS}`),
													eq(neighboringTiles.minY, sql`${tilesTable.minY} - ${TILE_SIZE_IN_METERS}`)
												),
												and(
													eq(neighboringTiles.minX, sql`${tilesTable.minX} - ${TILE_SIZE_IN_METERS}`),
													eq(neighboringTiles.minY, tilesTable.minY)
												),
												and(
													eq(neighboringTiles.minX, sql`${tilesTable.minX} + ${TILE_SIZE_IN_METERS}`),
													eq(neighboringTiles.minY, tilesTable.minY)
												),
												and(
													eq(neighboringTiles.minX, sql`${tilesTable.minX} - ${TILE_SIZE_IN_METERS}`),
													eq(neighboringTiles.minY, sql`${tilesTable.minY} + ${TILE_SIZE_IN_METERS}`)
												),
												and(
													eq(neighboringTiles.minX, tilesTable.minX),
													eq(neighboringTiles.minY, sql`${tilesTable.minY} + ${TILE_SIZE_IN_METERS}`)
												),
												and(
													eq(neighboringTiles.minX, sql`${tilesTable.minX} + ${TILE_SIZE_IN_METERS}`),
													eq(neighboringTiles.minY, sql`${tilesTable.minY} + ${TILE_SIZE_IN_METERS}`)
												)
											)
										)
									)
							)
						)
					)
					.limit(1)
			)
		)
		.returning();

	if (nextRenderJob !== undefined) {
		// Get neighboring tiles for the response
		const neighboringTilesIds = getNeigbhoringTilesIds(nextRenderJob);

		return new Response(
			JSON.stringify({
				type: 'render',
				data: {
					tileId: nextRenderJob.id,
					neigbhoringTilesIds: neighboringTilesIds
				}
			} satisfies RenderJob),
			{ status: 202 }
		);
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

	const nextPyramidJobs = await db
		.select()
		.from(pyramidRenderingStepJobTable)
		.where(pyramidJobWhereClause)
		.orderBy(pyramidRenderingStepJobTable.index)
		.limit(JOBS_LIMIT)
		.all();

	if (nextPyramidJobs.length !== 0) {
		for (const nextPyramidJob of nextPyramidJobs) {
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
						type: 'pyramid',
						data: {
							x: nextPyramidJob.x,
							y: nextPyramidJob.y,
							z: nextPyramidJob.zoom,
							baseZoomLevelTileId: nextPyramidJob.baseZoomLevelTileId,
							areaId: nextPyramidJob.areaToGenerateId
						}
					} satisfies PyramidJob),
					{ status: 202 }
				);
			}
		}

		return noJobLeftResponse;
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

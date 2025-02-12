import { TILE_SIZE_IN_METERS } from '$lib/constants.js';
import { getPyramidJobsFromTileList } from '$lib/pyramid';
import { getDb } from '$lib/server/db.js';
import {
	areasToGenerateTable,
	contributionTable,
	lidarStepJobTable,
	mapRenderingStepJobTable,
	pyramidRenderingStepJobTable,
	tilesTable,
	userTable,
	type Tile
} from '$lib/server/schema.js';
import { error, redirect } from '@sveltejs/kit';
import { and, eq, gt, inArray, lt } from 'drizzle-orm';
import { generateId } from 'lucia';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

export async function load() {
	const db = getDb();

	const [contributions, areas] = await db.batch([
		db
			.select()
			.from(contributionTable)
			.innerJoin(userTable, eq(userTable.id, contributionTable.fkUser))
			.where(eq(contributionTable.paied, true)),
		db.query.areasToGenerateTable.findMany()
	]);

	return { contributions, areas };
}

export const actions = {
	addArea: async ({ request }) => {
		const db = getDb();

		const form = await superValidate(
			request,
			zod(
				z.object({
					minX: z.number(),
					maxX: z.number(),
					minY: z.number(),
					maxY: z.number()
				})
			)
		);

		if (!form.valid) throw error(400);

		await db.transaction(async (tx) => {
			const areaId = generateId(15);

			await tx
				.insert(areasToGenerateTable)
				.values({
					id: areaId,
					minX: form.data.minX,
					minY: form.data.minY,
					maxX: form.data.maxX,
					maxY: form.data.maxY
				})
				.run();

			const tilesInside = await tx
				.select()
				.from(tilesTable)
				.where(
					and(
						gt(tilesTable.minX, form.data.minX - TILE_SIZE_IN_METERS),
						gt(tilesTable.minY, form.data.minY - TILE_SIZE_IN_METERS),
						lt(tilesTable.maxX, form.data.maxX + TILE_SIZE_IN_METERS),
						lt(tilesTable.maxY, form.data.maxY + TILE_SIZE_IN_METERS)
					)
				)
				.all();

			tilesInside.sort((tile1, tile2) => {
				if (tile1.minY === tile2.minY) return tile1.minX - tile2.minX;
				return tile1.minY - tile2.minY;
			});

			if (tilesInside.length === 0) return;
			const buffer = getTilesBuffer(tilesInside);

			const bufferTiles = await tx
				.select()
				.from(tilesTable)
				.where(
					inArray(
						tilesTable.id,
						buffer.map((t) => `${Math.round(t.minX)}_${Math.round(t.minY)}`)
					)
				)
				.all();

			const tilesForLidarStep = [...tilesInside, ...bufferTiles]
				.filter((t) => t.lidarStepStatus === 'not-started')
				.sort((tile1, tile2) => {
					if (tile1.minY === tile2.minY) return tile1.minX - tile2.minX;
					return tile1.minY - tile2.minY;
				});

			await tx
				.insert(lidarStepJobTable)
				.values(
					tilesForLidarStep.map((tile, index) => ({
						index,
						tileId: tile.id,
						areaToGenerateId: areaId
					}))
				)
				.run();

			const tilesForMapRendering = tilesInside
				.filter((t) => t.mapRenderingStepStatus === 'not-started')
				.sort((tile1, tile2) => {
					if (tile1.minY === tile2.minY) return tile1.minX - tile2.minX;
					return tile1.minY - tile2.minY;
				});

			await tx
				.insert(mapRenderingStepJobTable)
				.values(
					tilesForMapRendering.map((tile, index) => ({
						index,
						tileId: tile.id,
						areaToGenerateId: areaId
					}))
				)
				.run();
		});

		throw redirect(302, '/admin/areas');
	},
	mergeArea: async ({ request }) => {
		const db = getDb();

		const formdata = await request.formData();
		const areaId = formdata.get('area-id');
		if (typeof areaId !== 'string') throw error(400);

		const [mapRenderingJobsWithTiles, areasExistingPyramidJobs] = await db.batch([
			db
				.select()
				.from(mapRenderingStepJobTable)
				.innerJoin(tilesTable, eq(mapRenderingStepJobTable.tileId, tilesTable.id))
				.where(eq(mapRenderingStepJobTable.areaToGenerateId, areaId)),
			db
				.select({ id: pyramidRenderingStepJobTable.id })
				.from(pyramidRenderingStepJobTable)
				.where(eq(pyramidRenderingStepJobTable.areaToGenerateId, areaId))
		]);

		if (
			mapRenderingJobsWithTiles.some(({ tiles }) => tiles.mapRenderingStepStatus !== 'finished')
		) {
			throw error(400, 'All map rendering step jobs are not finished for this area.');
		}

		if (areasExistingPyramidJobs.length !== 0) {
			throw error(400, 'Area already merged.');
		}

		const pyramidJobs = getPyramidJobsFromTileList(
			mapRenderingJobsWithTiles.map(({ tiles: { minX, minY } }) => ({
				xLambert93: minX,
				yLambert93: minY
			}))
		);

		await db.transaction(async (tx) => {
			await tx
				.update(tilesTable)
				.set({ isMergeable: true })
				.where(
					inArray(
						tilesTable.id,
						mapRenderingJobsWithTiles.map(({ tiles }) => tiles.id)
					)
				)
				.run();

			await tx
				.update(areasToGenerateTable)
				.set({ isMergeable: true })
				.where(eq(areasToGenerateTable.id, areaId))
				.run();

			await tx
				.insert(pyramidRenderingStepJobTable)
				.values(
					pyramidJobs.map(({ x, y, z, baseZoomLevelTileId, index }) => ({
						areaToGenerateId: areaId,
						index,
						x,
						y,
						zoom: z,
						baseZoomLevelTileId
					}))
				)
				.run();
		});
	},
	deleteArea: async ({ request }) => {
		const formdata = await request.formData();
		const areaId = formdata.get('area-id');
		if (typeof areaId !== 'string') throw error(400);

		const db = getDb();
		await db.delete(areasToGenerateTable).where(eq(areasToGenerateTable.id, areaId)).run();
		throw redirect(302, '/admin/areas');
	},
	rerunAreasLidarStepJobs: async ({ request }) => {
		const formdata = await request.formData();
		const areaId = formdata.get('area-id');
		if (typeof areaId !== 'string') throw error(400);

		const db = getDb();

		await db
			.update(tilesTable)
			.set({
				lidarStepStatus: 'not-started',
				lidarStepWorkerId: null,
				lidarStepStartTime: null,
				lidarStepFinishTime: null,
				mapRenderingStepStatus: 'not-started',
				mapRenderingStepWorkerId: null,
				mapRenderingStepStartTime: null,
				mapRenderingStepFinishTime: null
			})
			.where(
				inArray(
					tilesTable.id,
					db
						.select({ id: lidarStepJobTable.tileId })
						.from(lidarStepJobTable)
						.where(eq(lidarStepJobTable.areaToGenerateId, areaId))
				)
			)
			.run();

		throw redirect(302, '/admin/areas');
	},
	rerunAreasRenderStepJobs: async ({ request }) => {
		const formdata = await request.formData();
		const areaId = formdata.get('area-id');
		if (typeof areaId !== 'string') throw error(400);

		const db = getDb();

		await db
			.update(tilesTable)
			.set({
				mapRenderingStepStatus: 'not-started',
				mapRenderingStepWorkerId: null,
				mapRenderingStepStartTime: null,
				mapRenderingStepFinishTime: null
			})
			.where(
				inArray(
					tilesTable.id,
					db
						.select({ id: mapRenderingStepJobTable.tileId })
						.from(mapRenderingStepJobTable)
						.where(eq(mapRenderingStepJobTable.areaToGenerateId, areaId))
				)
			)
			.run();

		throw redirect(302, '/admin/areas');
	},
	rerunAreasPyramidStepJobs: async ({ request }) => {
		const formdata = await request.formData();
		const areaId = formdata.get('area-id');
		if (typeof areaId !== 'string') throw error(400);

		const db = getDb();

		await db
			.update(pyramidRenderingStepJobTable)
			.set({
				status: 'not-started',
				workerId: null,
				startTime: null,
				finishTime: null
			})
			.where(and(eq(pyramidRenderingStepJobTable.areaToGenerateId, areaId)))
			.run();

		throw redirect(302, '/admin/areas');
	},
	invalidateAreasOngoingLidarJobs: async ({ request }) => {
		const formdata = await request.formData();
		const areaId = formdata.get('area-id');
		if (typeof areaId !== 'string') throw error(400);

		const db = getDb();

		await db
			.update(tilesTable)
			.set({
				lidarStepStatus: 'not-started',
				lidarStepWorkerId: null,
				lidarStepStartTime: null,
				lidarStepFinishTime: null,
				mapRenderingStepStatus: 'not-started',
				mapRenderingStepWorkerId: null,
				mapRenderingStepStartTime: null,
				mapRenderingStepFinishTime: null
			})
			.where(
				and(
					eq(tilesTable.lidarStepStatus, 'ongoing'),
					inArray(
						tilesTable.id,
						db
							.select({ id: lidarStepJobTable.tileId })
							.from(lidarStepJobTable)
							.where(eq(lidarStepJobTable.areaToGenerateId, areaId))
					)
				)
			)
			.run();

		throw redirect(302, '/admin/areas');
	},
	invalidateAreasOngoingRenderJobs: async ({ request }) => {
		const formdata = await request.formData();
		const areaId = formdata.get('area-id');
		if (typeof areaId !== 'string') throw error(400);

		const db = getDb();

		await db
			.update(tilesTable)
			.set({
				mapRenderingStepStatus: 'not-started',
				mapRenderingStepWorkerId: null,
				mapRenderingStepStartTime: null,
				mapRenderingStepFinishTime: null
			})
			.where(
				and(
					eq(tilesTable.mapRenderingStepStatus, 'ongoing'),
					inArray(
						tilesTable.id,
						db
							.select({ id: mapRenderingStepJobTable.tileId })
							.from(mapRenderingStepJobTable)
							.where(eq(mapRenderingStepJobTable.areaToGenerateId, areaId))
					)
				)
			)
			.run();

		throw redirect(302, '/admin/areas');
	},
	invalidateAreasOngoingPyramidJobs: async ({ request }) => {
		const formdata = await request.formData();
		const areaId = formdata.get('area-id');
		if (typeof areaId !== 'string') throw error(400);

		const db = getDb();

		await db
			.update(pyramidRenderingStepJobTable)
			.set({
				status: 'not-started',
				workerId: null,
				startTime: null,
				finishTime: null
			})
			.where(
				and(
					eq(pyramidRenderingStepJobTable.status, 'ongoing'),
					eq(pyramidRenderingStepJobTable.areaToGenerateId, areaId)
				)
			)
			.run();

		throw redirect(302, '/admin/areas');
	},
	rerunTileLidarStep: async ({ request }) => {
		const formdata = await request.formData();
		const tileId = formdata.get('tile-id');
		if (typeof tileId !== 'string') throw error(400);

		const db = getDb();
		await db
			.update(tilesTable)
			.set({
				lidarStepStatus: 'not-started',
				lidarStepWorkerId: null,
				lidarStepStartTime: null,
				lidarStepFinishTime: null,
				mapRenderingStepStatus: 'not-started',
				mapRenderingStepWorkerId: null,
				mapRenderingStepStartTime: null,
				mapRenderingStepFinishTime: null
			})
			.where(eq(tilesTable.id, tileId))
			.run();

		throw redirect(302, '/admin/areas');
	},
	rerunTileRendering: async ({ request }) => {
		const formdata = await request.formData();
		const tileId = formdata.get('tile-id');
		if (typeof tileId !== 'string') throw error(400);

		const db = getDb();
		await db
			.update(tilesTable)
			.set({
				mapRenderingStepStatus: 'not-started',
				mapRenderingStepWorkerId: null,
				mapRenderingStepStartTime: null,
				mapRenderingStepFinishTime: null
			})
			.where(eq(tilesTable.id, tileId))
			.run();

		throw redirect(302, '/admin/areas');
	},
	rerunTilePyramidGeneration: async ({ request }) => {
		const formdata = await request.formData();
		const tileId = formdata.get('tile-id');
		if (typeof tileId !== 'string') throw error(400);

		const db = getDb();

		const tile = await db
			.select()
			.from(tilesTable)
			.innerJoin(mapRenderingStepJobTable, eq(mapRenderingStepJobTable.tileId, tilesTable.id))
			.where(eq(tilesTable.id, tileId))
			.get();

		if (tile === undefined) throw error(404);

		const pyramidJobs = getPyramidJobsFromTileList([
			{
				xLambert93: tile.tiles.minX,
				yLambert93: tile.tiles.minY
			}
		]);

		const pyramidUpdates = pyramidJobs.map(({ x, y, z }) =>
			db
				.update(pyramidRenderingStepJobTable)
				.set({ status: 'not-started', workerId: null, startTime: null, finishTime: null })
				.where(
					and(
						eq(pyramidRenderingStepJobTable.x, x),
						eq(pyramidRenderingStepJobTable.y, y),
						eq(pyramidRenderingStepJobTable.zoom, z),
						eq(
							pyramidRenderingStepJobTable.areaToGenerateId,
							tile.map_rendering_step_jobs.areaToGenerateId
						)
					)
				)
		);

		const firstUpdate = pyramidUpdates.shift();

		if (firstUpdate !== undefined) {
			await db.batch([firstUpdate, ...pyramidUpdates]);
		}

		throw redirect(302, '/admin/areas');
	}
};

function getTilesBuffer(tiles: Tile[]) {
	const tilesBuffer: { minX: number; minY: number }[] = [];

	for (const tile of tiles) {
		// Top
		if (!tiles.some((t) => t.minX === tile.minX && t.minY === tile.minY - TILE_SIZE_IN_METERS))
			tilesBuffer.push({ minX: tile.minX, minY: tile.minY - TILE_SIZE_IN_METERS });

		// Top-right
		if (
			!tiles.some(
				(t) =>
					t.minX === tile.minX + TILE_SIZE_IN_METERS && t.minY === tile.minY - TILE_SIZE_IN_METERS
			)
		)
			tilesBuffer.push({
				minX: tile.minX + TILE_SIZE_IN_METERS,
				minY: tile.minY - TILE_SIZE_IN_METERS
			});

		// Right
		if (!tiles.some((t) => t.minX === tile.minX + TILE_SIZE_IN_METERS && t.minY === tile.minY))
			tilesBuffer.push({ minX: tile.minX + TILE_SIZE_IN_METERS, minY: tile.minY });

		// Bottom-right
		if (
			!tiles.some(
				(t) =>
					t.minX === tile.minX + TILE_SIZE_IN_METERS && t.minY === tile.minY + TILE_SIZE_IN_METERS
			)
		)
			tilesBuffer.push({
				minX: tile.minX + TILE_SIZE_IN_METERS,
				minY: tile.minY + TILE_SIZE_IN_METERS
			});

		// Bottom
		if (!tiles.some((t) => t.minX === tile.minX && t.minY === tile.minY + TILE_SIZE_IN_METERS))
			tilesBuffer.push({ minX: tile.minX, minY: tile.minY + TILE_SIZE_IN_METERS });

		// Bottom-left
		if (
			!tiles.some(
				(t) =>
					t.minX === tile.minX - TILE_SIZE_IN_METERS && t.minY === tile.minY + TILE_SIZE_IN_METERS
			)
		)
			tilesBuffer.push({
				minX: tile.minX - TILE_SIZE_IN_METERS,
				minY: tile.minY + TILE_SIZE_IN_METERS
			});

		// Left
		if (!tiles.some((t) => t.minX === tile.minX - TILE_SIZE_IN_METERS && t.minY === tile.minY))
			tilesBuffer.push({ minX: tile.minX - TILE_SIZE_IN_METERS, minY: tile.minY });

		// Top-left
		if (
			!tiles.some(
				(t) =>
					t.minX === tile.minX - TILE_SIZE_IN_METERS && t.minY === tile.minY - TILE_SIZE_IN_METERS
			)
		)
			tilesBuffer.push({
				minX: tile.minX - TILE_SIZE_IN_METERS,
				minY: tile.minY - TILE_SIZE_IN_METERS
			});
	}

	return tilesBuffer;
}

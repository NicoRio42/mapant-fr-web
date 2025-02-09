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
		db.query.areasToGenerateTable.findMany({ with: { lidarJobs: { with: { tile: true } } } })
	]);

	return { contributions, areas };
}

export const actions = {
	add: async ({ request }) => {
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
	merge: async ({ request }) => {
		const db = getDb();

		const formdata = await request.formData();
		const areaId = formdata.get('area-id');
		if (typeof areaId !== 'string') throw error(400);

		const mapRenderingJobsWithTiles = await db
			.select()
			.from(mapRenderingStepJobTable)
			.innerJoin(tilesTable, eq(mapRenderingStepJobTable.tileId, tilesTable.id))
			.where(eq(mapRenderingStepJobTable.areaToGenerateId, areaId))
			.all();

		if (
			mapRenderingJobsWithTiles.some(({ tiles }) => tiles.mapRenderingStepStatus !== 'finished')
		) {
			throw error(400, 'All map rendering step jobs are not finished for this area.');
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
	delete: async ({ request }) => {
		const formdata = await request.formData();
		const areaId = formdata.get('area-id');
		if (typeof areaId !== 'string') throw error(400);

		const db = getDb();
		await db.delete(areasToGenerateTable).where(eq(areasToGenerateTable.id, areaId)).run();
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
	rerunLidarStepForWholeArea: async ({ request }) => {
		const formdata = await request.formData();
		const areaId = formdata.get('area-id');
		if (typeof areaId !== 'string') throw error(400);

		const db = getDb();

		const area = await db
			.select()
			.from(areasToGenerateTable)
			.where(eq(areasToGenerateTable.id, areaId))
			.get();

		if (area === undefined) throw error(404);

		const tilesInside = await db
			.select({ id: tilesTable.id })
			.from(tilesTable)
			.where(
				and(
					gt(tilesTable.minX, area.minX - TILE_SIZE_IN_METERS * 2),
					gt(tilesTable.minY, area.minY - TILE_SIZE_IN_METERS * 2),
					lt(tilesTable.maxX, area.maxX + TILE_SIZE_IN_METERS * 2),
					lt(tilesTable.maxY, area.maxY + TILE_SIZE_IN_METERS * 2)
				)
			)
			.all();

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
					tilesInside.map(({ id }) => id)
				)
			)
			.run();

		throw redirect(302, '/admin/areas');
	},
	rerunTileRenderingForWholeArea: async ({ request }) => {
		const formdata = await request.formData();
		const areaId = formdata.get('area-id');
		if (typeof areaId !== 'string') throw error(400);

		const db = getDb();

		const area = await db
			.select()
			.from(areasToGenerateTable)
			.where(eq(areasToGenerateTable.id, areaId))
			.get();

		if (area === undefined) throw error(404);

		const tilesInside = await db
			.select({ id: tilesTable.id })
			.from(tilesTable)
			.where(
				and(
					gt(tilesTable.minX, area.minX - TILE_SIZE_IN_METERS),
					gt(tilesTable.minY, area.minY - TILE_SIZE_IN_METERS),
					lt(tilesTable.maxX, area.maxX + TILE_SIZE_IN_METERS),
					lt(tilesTable.maxY, area.maxY + TILE_SIZE_IN_METERS)
				)
			)
			.all();

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
					tilesInside.map(({ id }) => id)
				)
			)
			.run();

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

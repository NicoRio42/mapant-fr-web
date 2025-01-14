import { db } from '$lib/server/db.js';
import {
	areasToGenerateTable,
	lidarStepJobTable,
	mapRenderingStepJobTable,
	pyramidRenderingStepJobTable,
	tilesTable,
	workersTable
} from '$lib/server/schema';
import { Scrypt } from '$lib/server/scrypt';
import { eq } from 'drizzle-orm';
import type { LidarJob, NextJobApiEndpointResponse, NoJob, PyramidJob, RenderJob } from './schemas';

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
				type: 'lidar',
				data: {
					x: nextLidarJob.tiles.minX,
					y: nextLidarJob.tiles.minY,
					tileUrl: nextLidarJob.tiles.lidarFileUrl
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
		// TODO: check if lidar step has been completed for neigbhoring tiles

		await db
			.update(tilesTable)
			.set({ mapRenderingStepStatus: 'ongoing', mapRenderingStepWorkerId: workerId })
			.where(eq(tilesTable.id, nextRenderJob.tiles.id))
			.run();

		return new Response(
			JSON.stringify({
				type: 'render',
				data: {
					x: nextRenderJob.tiles.minX,
					y: nextRenderJob.tiles.minY
				}
			} satisfies RenderJob),
			{ status: 202 }
		);
	}

	const nextPyramidJob = await db
		.select()
		.from(pyramidRenderingStepJobTable)
		.where(eq(pyramidRenderingStepJobTable.status, 'not-started'))
		.orderBy(pyramidRenderingStepJobTable.index)
		.limit(1)
		.get();

	if (nextPyramidJob !== undefined) {
		await db
			.update(pyramidRenderingStepJobTable)
			.set({ status: 'ongoing' })
			.where(eq(pyramidRenderingStepJobTable.id, nextPyramidJob.id))
			.run();

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
					z: nextPyramidJob.zoom
				}
			} satisfies PyramidJob),
			{ status: 202 }
		);
	}

	return new Response(JSON.stringify({ type: 'no-job-left' } satisfies NoJob), {
		status: 202
	});
}

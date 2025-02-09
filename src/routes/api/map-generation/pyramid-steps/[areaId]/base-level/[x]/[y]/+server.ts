import { getDb } from '$lib/server/db';
import { pyramidRenderingStepJobTable } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';
import { getWorkerIdOrErrorStatus } from '../../../../../utils';
import { File as CloudflareFile } from '@cloudflare/workers-types';

export async function POST({ request, params: { areaId, x, y }, platform }) {
	const [workerId, errorStatus] = await getWorkerIdOrErrorStatus(request.headers);
	if (errorStatus !== null) return new Response(null, { status: errorStatus });

	const parsedX = parseInt(x, 10);
	const parsedY = parseInt(y, 10);

	if (isNaN(parsedX) || isNaN(parsedY)) {
		return new Response(null, { status: 400 });
	}

	const db = getDb();
	const pyramidJob = await db
		.select()
		.from(pyramidRenderingStepJobTable)
		.where(
			and(
				eq(pyramidRenderingStepJobTable.x, parsedX),
				eq(pyramidRenderingStepJobTable.y, parsedY),
				eq(pyramidRenderingStepJobTable.zoom, 11),
				eq(pyramidRenderingStepJobTable.areaToGenerateId, areaId)
			)
		)
		.get();

	if (pyramidJob === undefined) return new Response(null, { status: 404 });

	if (pyramidJob.workerId !== workerId) {
		console.error('Worker id does not match the one assign to the render step of this tile.');
		return new Response(null, { status: 400 });
	}

	if (pyramidJob.status !== 'ongoing') {
		console.error('Render step status for this tile is not ongoing.');
		return new Response(null, { status: 400 });
	}

	const tilesBucket = platform?.env?.R2_BUCKET_TILES;
	if (tilesBucket === undefined) return new Response(null, { status: 500 });

	const contentType = request.headers.get('content-type') || '';
	if (!contentType.startsWith('multipart/form-data')) {
		return new Response('Invalid content type', { status: 400 });
	}

	const zoom12Tiles = [
		{ z: 12, x: parsedX * 2, y: parsedY * 2 },
		{ z: 12, x: parsedX * 2 + 1, y: parsedY * 2 },
		{ z: 12, x: parsedX * 2, y: parsedY * 2 + 1 },
		{ z: 12, x: parsedX * 2 + 1, y: parsedY * 2 + 1 }
	];

	const zoom13Tiles = zoom12Tiles.flatMap(({ x: x12, y: y12 }) => [
		{ z: 13, x: x12 * 2, y: y12 * 2 },
		{ z: 13, x: x12 * 2 + 1, y: y12 * 2 },
		{ z: 13, x: x12 * 2, y: y12 * 2 + 1 },
		{ z: 13, x: x12 * 2 + 1, y: y12 * 2 + 1 }
	]);

	const tiles = [{ z: 11, x: parsedX, y: parsedY }, ...zoom12Tiles, ...zoom13Tiles];

	const formData = await request.formData();

	const tilesWithFiles: { file: File; tile: { x: number; y: number; z: number } }[] = [];

	for (const tile of tiles) {
		const key = `${tile.z}_${tile.x}_${tile.y}`;
		const file = formData.get(key);

		if (!file || !(file instanceof File)) {
			return new Response(`Tile ${key} is missing`, { status: 400 });
		}

		tilesWithFiles.push({ file, tile });
	}

	await Promise.all(
		tilesWithFiles.map(({ file, tile }) => {
			const objectKey = `${tile.z}/${tile.x}/${tile.y}.png`;

			return tilesBucket.put(objectKey, file as unknown as CloudflareFile, {
				httpMetadata: {
					contentType: file.type
				}
			});
		})
	).catch((error) => {
		console.error(error);
		return new Response(null, { status: 500 });
	});

	await db
		.update(pyramidRenderingStepJobTable)
		.set({ status: 'finished', finishTime: new Date() })
		.where(eq(pyramidRenderingStepJobTable.id, pyramidJob.id))
		.run();

	return new Response(null, { status: 202 });
}

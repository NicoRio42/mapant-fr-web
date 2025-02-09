import { getDb } from '$lib/server/db';
import { pyramidRenderingStepJobTable } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';
import { getWorkerIdOrErrorStatus } from '../../../../../utils';
import { File as CloudflareFile } from '@cloudflare/workers-types';

export async function GET({ request, params: { x, y, zoom }, platform }) {
	const [_, errorStatus] = await getWorkerIdOrErrorStatus(request.headers);
	if (errorStatus !== null) return new Response(null, { status: errorStatus });

	const parsedX = parseInt(x, 10);
	const parsedY = parseInt(y, 10);
	const parsedZoom = parseInt(zoom, 10);

	if (isNaN(parsedX) || isNaN(parsedY) || isNaN(parsedZoom)) {
		return new Response(null, { status: 400 });
	}

	const tilesBucket = platform?.env?.R2_BUCKET_TILES;
	if (tilesBucket === undefined) return new Response(null, { status: 500 });
	const objectKey = `${parsedZoom}/${parsedX}/${parsedY}.png`;

	try {
		const object = await tilesBucket.get(objectKey);

		if (object === null) {
			return new Response('Not Found', { status: 404 });
		}

		const headers = new Headers();
		headers.set('etag', object.httpEtag);

		return new Response(object.body as unknown as BodyInit, {
			headers
		});
	} catch (error) {
		console.error(error);
		return new Response(null, { status: 500 });
	}
}

export async function POST({ request, params: { areaId, x, y, zoom }, platform }) {
	const [workerId, errorStatus] = await getWorkerIdOrErrorStatus(request.headers);
	if (errorStatus !== null) return new Response(null, { status: errorStatus });

	const parsedX = parseInt(x, 10);
	const parsedY = parseInt(y, 10);
	const parsedZoom = parseInt(zoom, 10);

	if (isNaN(parsedX) || isNaN(parsedY) || isNaN(parsedZoom)) {
		return new Response(null, { status: 400 });
	}

	if (parsedZoom >= 11) {
		console.error('This endpoint should only be called for lower level zooms');
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
				eq(pyramidRenderingStepJobTable.zoom, Math.min(parsedZoom, 11)),
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

	const formData = await request.formData();
	const file = formData.get('file');

	if (!file || !(file instanceof File)) {
		return new Response('No file uploaded', { status: 400 });
	}

	const objectKey = `${parsedZoom}/${parsedX}/${parsedY}.png`;

	try {
		await tilesBucket.put(objectKey, file as unknown as CloudflareFile, {
			httpMetadata: {
				contentType: file.type
			}
		});
	} catch (error) {
		console.error(error);
		return new Response(null, { status: 500 });
	}

	await db
		.update(pyramidRenderingStepJobTable)
		.set({ status: 'finished', finishTime: new Date() })
		.where(eq(pyramidRenderingStepJobTable.id, pyramidJob.id))
		.run();

	return new Response(null, { status: 202 });
}

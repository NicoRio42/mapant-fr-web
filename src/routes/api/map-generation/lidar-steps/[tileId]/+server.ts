import { getDb } from '$lib/server/db';
import { tilesTable } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { getWorkerIdOrErrorStatus } from '../../utils';
import { File as CloudflareFile } from '@cloudflare/workers-types';

export async function GET({ request, platform, params }) {
	const [_workerId, errorStatus] = await getWorkerIdOrErrorStatus(request.headers);
	if (errorStatus !== null) return new Response(null, { status: errorStatus });

	const db = getDb();
	const tile = await db.select().from(tilesTable).where(eq(tilesTable.id, params.tileId)).get();
	if (tile === undefined) return new Response(null, { status: 404 });

	const bucket = platform?.env?.R2_BUCKET;
	if (bucket === undefined) return new Response(null, { status: 500 });

	const objectKey = `v1/lidar-step/${tile.id}.tar.xz`;

	try {
		const object = await bucket.get(objectKey);

		if (object === null) {
			return new Response('Not Found', { status: 404 });
		}

		const headers = new Headers();
		headers.set('etag', object.httpEtag);

		if (object.httpMetadata?.contentType) {
			headers.set('Content-Type', object.httpMetadata.contentType);
		}

		return new Response(object.body as unknown as BodyInit, {
			headers
		});
	} catch (error) {
		console.error(error);
		return new Response(null, { status: 500 });
	}
}

export async function POST({ request, platform, params }) {
	const [workerId, errorStatus] = await getWorkerIdOrErrorStatus(request.headers);
	if (errorStatus !== null) return new Response(null, { status: errorStatus });

	const db = getDb();
	const tile = await db.select().from(tilesTable).where(eq(tilesTable.id, params.tileId)).get();
	if (tile === undefined) return new Response(null, { status: 404 });

	if (tile.lidarStepWorkerId !== workerId) {
		console.error('Worker id does not match the one assign to the LiDAR step of this tile.');
		return new Response(null, { status: 400 });
	}

	if (tile.lidarStepStatus !== 'ongoing') {
		console.error(`LiDAR step status for this tile is not ongoing but ${tile.lidarStepStatus}`);
		return new Response(null, { status: 400 });
	}

	const bucket = platform?.env?.R2_BUCKET;
	if (bucket === undefined) return new Response(null, { status: 500 });

	// Parse the incoming multipart form data
	const contentType = request.headers.get('content-type') || '';
	if (!contentType.startsWith('multipart/form-data')) {
		return new Response('Invalid content type', { status: 400 });
	}

	const formData = await request.formData();
	const file = formData.get('file');

	if (!file || !(file instanceof File)) {
		return new Response('No file uploaded', { status: 400 });
	}

	const objectKey = `v1/lidar-step/${tile.id}.tar.xz`;

	try {
		await bucket.put(objectKey, file as unknown as CloudflareFile, {
			httpMetadata: {
				contentType: file.type
			}
		});
	} catch (error) {
		console.error(error);
		return new Response(null, { status: 500 });
	}

	await db
		.update(tilesTable)
		.set({ lidarStepStatus: 'finished', lidarStepFinishTime: new Date() })
		.where(eq(tilesTable.id, tile.id))
		.run();

	return new Response(null, { status: 202 });
}

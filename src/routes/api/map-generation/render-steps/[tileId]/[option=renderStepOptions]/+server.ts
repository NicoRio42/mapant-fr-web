import { getDb } from '$lib/server/db';
import { tilesTable } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export async function GET({ platform, params }) {
	const db = getDb();
	const tile = await db.select().from(tilesTable).where(eq(tilesTable.id, params.tileId)).get();
	if (tile === undefined) return new Response(null, { status: 404 });

	const bucket = platform?.env?.R2_BUCKET;
	if (bucket === undefined) return new Response(null, { status: 500 });

	const extention = params.option === 'full-map' ? 'png' : 'tar.xz';
	const objectKey = `${tile.id}/${params.option}.${extention}`;

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

import { dev } from '$app/environment';

export async function GET({ params, platform }) {
	if (!dev) return new Response(null, { status: 400 });
	const bucket = platform?.env?.R2_BUCKET;
	if (bucket === undefined) return new Response(null, { status: 500 });

	try {
		const object = await bucket.get(params.fileName);

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

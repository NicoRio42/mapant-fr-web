import { getDb } from '$lib/server/db';
import { tilesTable } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { getWorkerIdOrErrorStatus } from '../../utils';
import { File as CloudflareFile } from '@cloudflare/workers-types';

export async function POST({ request, platform, params }) {
	const [workerId, errorStatus] = await getWorkerIdOrErrorStatus(request.headers);
	if (errorStatus !== null) return new Response(null, { status: errorStatus });

	const db = getDb();
	const tile = await db.select().from(tilesTable).where(eq(tilesTable.id, params.tileId)).get();
	if (tile === undefined) return new Response(null, { status: 404 });

	if (tile.mapRenderingStepWorkerId !== workerId) {
		console.error('Worker id does not match the one assign to the render step of this tile.');
		return new Response(null, { status: 400 });
	}

	if (tile.mapRenderingStepStatus !== 'ongoing') {
		console.error('Render step status for this tile is not ongoing.');
		return new Response(null, { status: 400 });
	}

	const bucket = platform?.env?.R2_BUCKET;
	if (bucket === undefined) return new Response(null, { status: 500 });

	const contentType = request.headers.get('content-type') || '';

	if (!contentType.startsWith('multipart/form-data')) {
		return new Response('Invalid content type', { status: 400 });
	}

	const formData = await request.formData();
	const rastersFile = formData.get('rasters');
	const shapefilesFile = formData.get('shapefiles');
	const pngsFile = formData.get('pngs');
	const fullMapFile = formData.get('full-map');

	if (!rastersFile || !(rastersFile instanceof File)) {
		return new Response('No rasters file uploaded', { status: 400 });
	}

	if (!shapefilesFile || !(shapefilesFile instanceof File)) {
		return new Response('No shapefiles file uploaded', { status: 400 });
	}

	if (!pngsFile || !(pngsFile instanceof File)) {
		return new Response('No pngs file uploaded', { status: 400 });
	}

	if (!fullMapFile || !(fullMapFile instanceof File)) {
		return new Response('No full-map file uploaded', { status: 400 });
	}

	await Promise.all([
		bucket.put(
			`v1/render-step/${tile.id}/rasters.tar.xz`,
			rastersFile as unknown as CloudflareFile,
			{
				httpMetadata: { contentType: rastersFile.type }
			}
		),
		bucket.put(
			`v1/render-step/${tile.id}/shapefiles.tar.xz`,
			shapefilesFile as unknown as CloudflareFile,
			{ httpMetadata: { contentType: shapefilesFile.type } }
		),
		bucket.put(`v1/render-step/${tile.id}/pngs.tar.xz`, pngsFile as unknown as CloudflareFile, {
			httpMetadata: { contentType: pngsFile.type }
		}),
		bucket.put(`v1/render-step/${tile.id}/full-map.png`, fullMapFile as unknown as CloudflareFile, {
			httpMetadata: { contentType: fullMapFile.type }
		})
	]).catch((error) => {
		console.error(error);

		return new Response(null, { status: 500 });
	});

	await db
		.update(tilesTable)
		.set({ mapRenderingStepStatus: 'finished', mapRenderingStepFinishTime: new Date() })
		.where(eq(tilesTable.id, tile.id))
		.run();

	return new Response(null, { status: 202 });
}

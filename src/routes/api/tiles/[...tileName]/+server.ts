import { env } from 'cloudflare:workers';
import { serveMapantTile } from '#lib/server/mapant-pmtiles.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, params }) =>
	serveMapantTile(request, params.tileName, env.R2_BUCKET_MAPANT);

export const HEAD = GET;

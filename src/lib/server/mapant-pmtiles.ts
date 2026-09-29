// Copyright 2021 Protomaps LLC. BSD-3-Clause; see docs/pmtiles-LICENSE.txt.
// R2 range source and native decompression adapted from the PMTiles Worker:
// https://github.com/protomaps/PMTiles/blob/main/serverless/cloudflare/src/index.ts
import type { R2Bucket } from '@cloudflare/workers-types';
import {
	Compression,
	EtagMismatch,
	PMTiles,
	ResolvedValueCache,
	TileType,
	type RangeResponse,
	type Source
} from 'pmtiles';

export const MAPANT_ARCHIVE_KEY = '2026-09-28-mapant-fr.pmtiles';

class ArchiveNotFound extends Error {}

async function nativeDecompress(data: ArrayBuffer, compression: Compression): Promise<ArrayBuffer> {
	if (compression === Compression.None || compression === Compression.Unknown) return data;
	if (compression === Compression.Gzip) {
		const stream = new Response(data).body!.pipeThrough(new DecompressionStream('gzip'));
		return new Response(stream).arrayBuffer();
	}
	throw new Error('Unsupported PMTiles compression');
}

// Cache only resolved headers/directories in the isolate: Workers cannot share
// pending I/O between requests. HTTP responses are cached by Workers Cache.
const directoryCache = new ResolvedValueCache(25, undefined, nativeDecompress);

class R2Source implements Source {
	constructor(private bucket: R2Bucket) {}

	getKey() {
		return `mapant-fr/${MAPANT_ARCHIVE_KEY}`;
	}

	async getBytes(
		offset: number,
		length: number,
		_signal?: AbortSignal,
		etag?: string
	): Promise<RangeResponse> {
		const object = await this.bucket.get(MAPANT_ARCHIVE_KEY, {
			range: { offset, length },
			...(etag ? { onlyIf: { etagMatches: etag } } : {})
		});
		if (!object) throw new ArchiveNotFound();
		if (!('body' in object)) throw new EtagMismatch();
		return { data: await object.arrayBuffer(), etag: object.etag };
	}
}

export async function serveMapantTile(
	request: Request,
	tileName: string,
	bucket?: R2Bucket
): Promise<Response> {
	const respond = (
		body: BodyInit | null,
		status: number,
		cacheControl = 'no-store',
		headers: Record<string, string> = {}
	) =>
		new Response(request.method === 'HEAD' ? null : body, {
			status,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': cacheControl,
				...headers
			}
		});

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return respond('Method Not Allowed', 405, 'no-store', { Allow: 'GET, HEAD' });
	}

	const match = /^(0|[1-9]\d*)\/(0|[1-9]\d*)\/(0|[1-9]\d*)\.webp$/.exec(tileName);
	if (!match) return respond('Not Found', 404);
	const [z, x, y] = match.slice(1).map(Number);
	// PMTiles tile IDs support zooms 0–26. Validate before touching R2.
	if (
		z > 26 ||
		!Number.isSafeInteger(x) ||
		!Number.isSafeInteger(y) ||
		x >= 2 ** z ||
		y >= 2 ** z
	) {
		return respond('Invalid tile coordinates', 400);
	}
	if (!bucket) return respond('Map archive storage unavailable', 503);

	const archive = new PMTiles(new R2Source(bucket), directoryCache, nativeDecompress);
	try {
		const header = await archive.getHeader();
		const cacheControl = 'public, max-age=86400';
		if (z < header.minZoom || z > header.maxZoom) return respond(null, 404, cacheControl);
		if (header.tileType !== TileType.Webp) {
			throw new Error('Map archive must contain WebP tiles');
		}
		const tile = await archive.getZxy(z, x, y);
		if (!tile) return respond(null, 204, cacheControl);
		return respond(tile.data, 200, cacheControl, { 'Content-Type': 'image/webp' });
	} catch (error) {
		if (error instanceof ArchiveNotFound) return respond('Map archive not found', 404);
		console.error('Could not read Mapant PMTiles tile', error);
		return respond('Could not read map tile', 500);
	}
}

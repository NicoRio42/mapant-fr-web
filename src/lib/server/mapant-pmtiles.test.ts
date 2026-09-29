import type { R2Bucket } from '@cloudflare/workers-types';
import { gzipSync } from 'node:zlib';
import { Compression, TileType } from 'pmtiles';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// A PMTiles v3 archive with one z0 tile and a gzip-compressed root directory.
// Exercise the real PMTiles decoder; only R2 storage is substituted.
const tile = Uint8Array.from(
	Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64')
);
function archiveFixture(tileType = TileType.Webp) {
	const root = gzipSync(Uint8Array.of(1, 0, 1, tile.length, 1));
	const bytes = new Uint8Array(16384 + tile.length);
	bytes.set(new TextEncoder().encode('PMTiles'));
	const header = new DataView(bytes.buffer);
	header.setUint8(7, 3);
	for (const [offset, value] of [
		[8, 127],
		[16, root.length],
		[24, 127 + root.length],
		[32, 2],
		[56, 16384],
		[64, tile.length],
		[72, 1],
		[80, 1],
		[88, 1]
	])
		header.setBigUint64(offset, BigInt(value), true);
	header.setUint8(96, 1);
	header.setUint8(97, Compression.Gzip);
	header.setUint8(98, Compression.None);
	header.setUint8(99, tileType);
	header.setUint8(100, 0);
	header.setUint8(101, 13);
	bytes.set(root, 127);
	bytes.set(new TextEncoder().encode('{}'), 127 + root.length);
	bytes.set(tile, 16384);
	return bytes;
}

function storage(bytes = archiveFixture()) {
	const get = vi.fn(
		async (
			_key: string,
			options: { range: { offset: number; length: number }; onlyIf?: { etagMatches: string } }
		) => {
			const { offset, length } = options.range;
			const data = bytes.slice(offset, offset + length);
			return {
				body: new Response(data).body,
				arrayBuffer: async () => data.buffer,
				etag: 'archive-v1'
			};
		}
	);
	return { get, bucket: { get } as unknown as R2Bucket };
}

async function serve(tileName: string, bucket?: R2Bucket, method = 'GET') {
	const { serveMapantTile } = await import('./mapant-pmtiles.js');
	return serveMapantTile(
		new Request(`https://mapant.fr/api/tiles/${tileName}`, { method }),
		tileName,
		bucket
	);
}

beforeEach(() => vi.resetModules());

describe('Mapant PMTiles endpoint', () => {
	it('serves WebP bytes from bounded R2 reads with Workers Cache headers', async () => {
		const { bucket, get } = storage();
		const response = await serve('0/0/0.webp', bucket);
		expect(response.status).toBe(200);
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(tile);
		expect(response.headers.get('Content-Type')).toBe('image/webp');
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400');
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		expect(get.mock.calls).toEqual([
			['2026-09-28-mapant-fr.pmtiles', { range: { offset: 0, length: 16384 } }],
			[
				'2026-09-28-mapant-fr.pmtiles',
				{ range: { offset: 16384, length: tile.length }, onlyIf: { etagMatches: 'archive-v1' } }
			]
		]);
		await serve('0/0/0.webp', bucket);
		expect(get).toHaveBeenCalledTimes(3); // Header/directory are reused, tile responses use Workers Cache.
	});

	it('returns the same headers and no body for HEAD', async () => {
		const { bucket } = storage();
		const get = await serve('0/0/0.webp', bucket);
		const head = await serve('0/0/0.webp', bucket, 'HEAD');
		expect(head.status).toBe(get.status);
		expect([...head.headers]).toEqual([...get.headers]);
		expect(await head.text()).toBe('');
	});

	it('returns cacheable empty and out-of-zoom responses without reading tile data', async () => {
		const { bucket, get } = storage();
		expect((await serve('1/0/0.webp', bucket)).status).toBe(204);
		const response = await serve('14/0/0.webp', bucket);
		expect(response.status).toBe(404);
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400');
		expect(get).toHaveBeenCalledTimes(1);
	});

	it.each([
		['../archive.pmtiles', 404],
		['0/0/0.png', 404],
		['0/0/0.webp/extra', 404],
		['-1/0/0.webp', 404],
		['27/0/0.webp', 400],
		['1/2/0.webp', 400],
		['1/0/2.webp', 400],
		['1/9007199254740992/0.webp', 400]
	])('rejects invalid tile path %s before R2 access', async (path, status) => {
		const { bucket, get } = storage();
		const response = await serve(path, bucket);
		expect(response.status).toBe(status);
		expect(response.headers.get('Cache-Control')).toBe('no-store');
		expect(get).not.toHaveBeenCalled();
	});

	it('rejects unsupported methods', async () => {
		const { bucket, get } = storage();
		const response = await serve('0/0/0.webp', bucket, 'POST');
		expect(response.status).toBe(405);
		expect(response.headers.get('Allow')).toBe('GET, HEAD');
		expect(get).not.toHaveBeenCalled();
	});

	it('does not cache a missing binding or archive', async () => {
		const unavailable = await serve('0/0/0.webp');
		expect(unavailable.status).toBe(503);
		expect(unavailable.headers.get('Cache-Control')).toBe('no-store');
		const bucket = { get: vi.fn().mockResolvedValue(null) } as unknown as R2Bucket;
		const missing = await serve('0/0/0.webp', bucket);
		expect(missing.status).toBe(404);
		expect(missing.headers.get('Cache-Control')).toBe('no-store');
	});

	it('reloads the archive directory after an R2 ETag mismatch', async () => {
		const { bucket, get } = storage();
		const normalGet = get.getMockImplementation()!;
		get.mockImplementationOnce(normalGet);
		get.mockImplementationOnce(
			async () => ({ etag: 'archive-v2' }) as Awaited<ReturnType<typeof normalGet>>
		);
		const response = await serve('0/0/0.webp', bucket);
		expect(response.status).toBe(200);
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(tile);
		expect(get).toHaveBeenCalledTimes(4);
		expect(get.mock.calls[2][1].range.offset).toBe(0);
	});

	it.each(['storage failure', 'wrong tile format', 'corrupt archive'])(
		'does not cache %s',
		async (failure) => {
			const log = vi.spyOn(console, 'error').mockImplementation(() => {});
			try {
				const { bucket, get } = storage(
					failure === 'wrong tile format'
						? archiveFixture(TileType.Png)
						: failure === 'corrupt archive'
							? new Uint8Array(16384)
							: archiveFixture()
				);
				if (failure === 'storage failure') get.mockRejectedValue(new Error('R2 unavailable'));
				const response = await serve('0/0/0.webp', bucket);
				expect(response.status).toBe(500);
				expect(response.headers.get('Cache-Control')).toBe('no-store');
			} finally {
				log.mockRestore();
			}
		}
	);
});

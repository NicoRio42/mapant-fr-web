import { describe, expect, it, vi } from 'vitest';
import { fromLonLat } from 'ol/proj.js';
import {
	findCoveredLocation,
	formatDistance,
	guessDistance,
	isInFrance,
	sampleLocation,
	targetTile
} from './round.js';
import { MAPANT_MAX_Y, MAPANT_MIN_X } from '../components/map/mapant-tile-grid.js';

const paris = fromLonLat([2.3522, 48.8566], 'EPSG:2154');
const lyon = fromLonLat([4.8357, 45.764], 'EPSG:2154');
const response = (status: number) => new Response(null, { status });
const options = () => ({
	baseUrl: '/api/tiles',
	signal: new AbortController().signal,
	sample: () => paris
});

describe('France sampling and grid', () => {
	it('includes mainland France and Corsica but excludes overseas, sea and neighbours', () => {
		for (const point of [
			[2.35, 48.85],
			[9.1, 42.2],
			[-4.49, 48.39]
		]) {
			expect(isInFrance(fromLonLat(point, 'EPSG:2154'))).toBe(true);
		}
		for (const point of [
			[-2, 46],
			[7.44, 46.95],
			[-53, 4],
			[9.1, 40]
		]) {
			expect(isInFrance(fromLonLat(point, 'EPSG:2154'))).toBe(false);
		}
	});
	it('samples valid projected points with a deterministic random stream', () => {
		let seed = 12345;
		const random = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32;
		for (let i = 0; i < 100; i++) expect(isInFrance(sampleLocation(random))).toBe(true);
	});
	it('uses the offset Lambert grid and top-down Y at native zoom, including boundaries', () => {
		expect(targetTile([MAPANT_MIN_X + 1000, MAPANT_MAX_Y - 1250])).toEqual([13, 4, 5]);
		expect(targetTile([MAPANT_MIN_X + 999.99, MAPANT_MAX_Y - 1249.99])).toEqual([13, 3, 4]);
	});
});

describe('coverage search', () => {
	it('accepts a target only after all nine HEAD requests return 200', async () => {
		const fetchTile = vi.fn<typeof fetch>().mockResolvedValue(response(200));
		expect(await findCoveredLocation({ ...options(), fetchTile })).toEqual(paris);
		expect(fetchTile).toHaveBeenCalledTimes(9);
		expect(new Set(fetchTile.mock.calls.map(([url]) => url)).size).toBe(9);
		for (const [url, init] of fetchTile.mock.calls) {
			expect(url).toMatch(/^\/api\/tiles\/13\/\d+\/\d+\.webp$/);
			expect(init?.method).toBe('HEAD');
		}
	});
	it.each([204, 404])(
		'retries missing centre tiles (%s), even though 204 is response.ok',
		async (status) => {
			const sample = vi.fn().mockReturnValueOnce(paris).mockReturnValue(lyon);
			const fetchTile = vi.fn<typeof fetch>().mockResolvedValue(response(200));
			fetchTile.mockResolvedValueOnce(response(status));
			expect(await findCoveredLocation({ ...options(), sample, fetchTile })).toEqual(lyon);
			expect(fetchTile).toHaveBeenCalledTimes(10);
		}
	);
	it('rejects a populated centre if a neighbour is absent', async () => {
		const sample = vi.fn().mockReturnValueOnce(paris).mockReturnValue(lyon);
		const fetchTile = vi.fn<typeof fetch>().mockResolvedValue(response(200));
		fetchTile.mockResolvedValueOnce(response(200)).mockResolvedValueOnce(response(204));
		expect(await findCoveredLocation({ ...options(), sample, fetchTile })).toEqual(lyon);
		expect(fetchTile).toHaveBeenCalledTimes(18);
	});
	it('bounds attempts when coverage is absent', async () => {
		const fetchTile = vi.fn<typeof fetch>().mockResolvedValue(response(204));
		await expect(findCoveredLocation({ ...options(), fetchTile, maxAttempts: 3 })).rejects.toThrow(
			'Aucun lieu'
		);
		expect(fetchTile).toHaveBeenCalledTimes(3);
	});
	it('reports a storage failure without treating it as missing coverage', async () => {
		const fetchTile = vi.fn<typeof fetch>().mockResolvedValue(response(503));
		await expect(findCoveredLocation({ ...options(), fetchTile })).rejects.toThrow('HTTP 503');
		expect(fetchTile).toHaveBeenCalledTimes(1);
	});
	it('reports network failures', async () => {
		const fetchTile = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
		await expect(findCoveredLocation({ ...options(), fetchTile })).rejects.toThrow(
			'Impossible de joindre'
		);
	});
	it('does not fetch when already cancelled', async () => {
		const controller = new AbortController();
		controller.abort();
		const fetchTile = vi.fn<typeof fetch>();
		await expect(
			findCoveredLocation({ ...options(), fetchTile, signal: controller.signal })
		).rejects.toMatchObject({ name: 'AbortError' });
		expect(fetchTile).not.toHaveBeenCalled();
	});
	it('cancels outstanding requests when a round is replaced', async () => {
		const controller = new AbortController();
		let requestSignal: AbortSignal | undefined;
		const fetchTile = vi.fn<typeof fetch>().mockImplementation(
			(_url, init) =>
				new Promise((_resolve, reject) => {
					requestSignal = init!.signal!;
					requestSignal.addEventListener('abort', () => reject(requestSignal!.reason), {
						once: true
					});
				})
		);
		const result = findCoveredLocation({ ...options(), fetchTile, signal: controller.signal });
		controller.abort();
		await expect(result).rejects.toMatchObject({ name: 'AbortError' });
		expect(requestSignal?.aborted).toBe(true);
	});
	it('times out a hanging tile request', async () => {
		vi.useFakeTimers();
		try {
			const fetchTile = vi.fn<typeof fetch>().mockImplementation(
				(_url, init) =>
					new Promise((_resolve, reject) => {
						const signal = init!.signal!;
						signal.addEventListener('abort', () => reject(signal.reason), { once: true });
					})
			);
			const result = findCoveredLocation({ ...options(), fetchTile, timeoutMs: 100 });
			const assertion = expect(result).rejects.toThrow('trop de temps');
			await vi.advanceTimersByTimeAsync(100);
			await assertion;
		} finally {
			vi.useRealTimers();
		}
	});
});

describe('distance', () => {
	it('converts Lambert-93 to longitude/latitude before measuring', () => {
		expect(guessDistance(paris, [2.3522, 48.8566])).toBeLessThan(0.01);
		expect(guessDistance(paris, [4.8357, 45.764]) / 1000).toBeCloseTo(391.5, 0);
	});
	it('formats short and long distances', () => {
		expect(formatDistance(12.3)).toBe('12 m');
		expect(formatDistance(1234)).toBe('1,2 km');
	});
});

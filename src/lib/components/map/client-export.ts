import { MAPANT_TILES_BASE_URL } from './mapant-tile-url.js';
import { getExportTiles } from './export-tiles.js';

const EXPORT_AREA_LIMIT = 50 * 1_000 * 1_000;

export async function clientExport({
	x1,
	y1,
	x2,
	y2
}: {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}): Promise<null | 'AREA_TOO_BIG'> {
	if (Math.abs(x2 - x1) * Math.abs(y2 - y1) > EXPORT_AREA_LIMIT) {
		return 'AREA_TOO_BIG';
	}

	const cacheBust = new URLSearchParams(location.search).has('bypass-cache')
		? `?${Date.now()}`
		: '';
	const { tiles, scale, width, height } = getExportTiles(
		{ x1, y1, x2, y2 },
		new URL(MAPANT_TILES_BASE_URL, location.origin).href,
		cacheBust
	);
	const worker = new Worker(new URL('./client-export-worker.ts', import.meta.url));

	return new Promise<null>((resolve) => {
		worker.onmessage = (event) => {
			const { blob, fileName } = event.data;
			const link = document.createElement('a');
			link.download = fileName;
			link.href = URL.createObjectURL(blob);
			link.click();
			worker.terminate();
			resolve(null);
		};

		worker.onerror = console.error;
		worker.postMessage({ tiles, scale, width, height, x1, y1, x2, y2 });
	});
}

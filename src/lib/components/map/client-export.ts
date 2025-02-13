import { PUBLIC_MAPANT_ASSETS_BASE_URL } from '$env/static/public';

const EXPORT_TILE_LIMIT = 20_000;
const TILE_PIXEL_SIZE = 2362;

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
	return new Promise<null | 'AREA_TOO_BIG'>((resolve) => {
		if (Math.abs(x2 - x1) > EXPORT_TILE_LIMIT || Math.abs(y2 - y1) > EXPORT_TILE_LIMIT) {
			resolve('AREA_TOO_BIG');
		}

		const tiles: string[][] = [];

		const minX = Math.floor(Math.min(x1, x2) / 1000) * 1000;
		const maxX = Math.floor(Math.max(x1, x2) / 1000) * 1000 + 1000;
		const minY = Math.floor(Math.min(y1, y2) / 1000) * 1000;
		const maxY = Math.floor(Math.max(y1, y2) / 1000) * 1000 + 1000;

		for (let x = minX; x < maxX; x += 1000) {
			const column: string[] = [];

			for (let y = minY; y < maxY; y += 1000) {
				column.push(`${PUBLIC_MAPANT_ASSETS_BASE_URL}/${x}_${y}/full-map.png`);
			}

			tiles.push(column);
		}

		const width = (TILE_PIXEL_SIZE * Math.abs(x2 - x1)) / 1000;
		const height = (TILE_PIXEL_SIZE * Math.abs(y2 - y1)) / 1000;

		const xOffset = ((Math.min(x1, x2) - minX) * TILE_PIXEL_SIZE) / 1000;
		const yOffset = ((Math.min(y1, y2) - minY) * TILE_PIXEL_SIZE) / 1000;

		const worker = new Worker(new URL('./client-export-worker.ts', import.meta.url));

		worker.postMessage({ tiles, width, height, xOffset, yOffset, TILE_PIXEL_SIZE, x1, y1, x2, y2 });

		worker.onmessage = (event) => {
			const { blob, fileName } = event.data;
			const link = document.createElement('a');
			link.download = fileName;
			link.href = URL.createObjectURL(blob);
			link.click();
			resolve(null);
		};
	});
}

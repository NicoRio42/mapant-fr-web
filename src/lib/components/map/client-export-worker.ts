import type { ExportTile } from './export-tiles.js';

self.onmessage = async (event) => {
	const { tiles, scale, width, height, x1, y1, x2, y2 } = event.data as {
		tiles: ExportTile[];
		scale: number;
		width: number;
		height: number;
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	};
	const offscreen = new OffscreenCanvas(width, height);
	const ctx = offscreen.getContext('2d')!;
	ctx.scale(scale, scale);
	let nextTile = 0;

	async function drawTiles() {
		while (nextTile < tiles.length) {
			const { url, x, y } = tiles[nextTile++];
			try {
				const response = await fetch(url);
				if (!response.ok) continue;

				const bitmap = await createImageBitmap(await response.blob());
				ctx.drawImage(bitmap, x, y);
				bitmap.close();
			} catch (error) {
				console.error(error);
			}
		}
	}

	await Promise.all(Array.from({ length: Math.min(8, tiles.length) }, () => drawTiles()));
	const blob = await offscreen.convertToBlob();
	self.postMessage({
		blob,
		fileName: `export-${Math.round(x1)}-${Math.round(y1)}-${Math.round(x2)}-${Math.round(y2)}.png`
	});
	self.close();
};

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
	if (Math.abs(x2 - x1) > EXPORT_TILE_LIMIT || Math.abs(y2 - y1) > EXPORT_TILE_LIMIT) {
		return 'AREA_TOO_BIG';
	}

	const tiles: string[][] = [];
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d')!;

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

	canvas.width = width;
	canvas.height = height;

	const xOffset = ((Math.min(x1, x2) - minX) * TILE_PIXEL_SIZE) / 1000;
	const yOffset = ((Math.min(y1, y2) - minY) * TILE_PIXEL_SIZE) / 1000;

	const blobs = await Promise.all(
		tiles.map((column) => column.map((url) => fetch(url).then((r) => r.blob())))
	);

	const imgs: { img: HTMLImageElement; x: number; y: number }[] = [];
	let imgsCount = 0;
	const imgsNumber = tiles.length * tiles[0].length;

	function drawImgsAndDownloadFile() {
		imgs.forEach(({ img, x, y }) => ctx.drawImage(img, x, y));

		const link = document.createElement('a');
		link.download = `export-${Math.round(x1)}-${Math.round(y1)}-${Math.round(x2)}-${Math.round(y2)}.png`;
		link.href = canvas.toDataURL();
		link.click();
	}

	const maxXForDrawing = (maxX - minX) / 1000;
	const maxYForDrawing = (maxY - minY) / 1000;

	for (let x = 0; x < maxXForDrawing; x++) {
		for (let y = 0; y < maxYForDrawing; y++) {
			const blob = await blobs[x][y];

			if (!blob || blob.type === 'text/plain') {
				imgsCount++;
				continue;
			}

			const img = new Image();

			img.onload = () => {
				imgs.push({
					img,
					x: x * TILE_PIXEL_SIZE - xOffset,
					y: height - TILE_PIXEL_SIZE - y * TILE_PIXEL_SIZE + yOffset
				});

				imgsCount++;
				if (imgsCount === imgsNumber) drawImgsAndDownloadFile();
			};

			img.src = URL.createObjectURL(blob);
		}
	}

	return null;
}

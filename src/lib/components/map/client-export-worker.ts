self.onmessage = async (event) => {
	const { tiles, width, height, xOffset, yOffset, TILE_PIXEL_SIZE, x1, y1, x2, y2 } = event.data;
	const offscreen = new OffscreenCanvas(width, height);
	const ctx = offscreen.getContext('2d')!;

	const imgs: { bitmap: ImageBitmap; x: number; y: number }[] = [];
	let imgsCount = 0;
	const imgsNumber = tiles.length * tiles[0].length;

	function drawImgsAndDownloadFile() {
		imgs.forEach(({ bitmap, x, y }) => ctx.drawImage(bitmap, x, y));

		offscreen.convertToBlob().then((blob) => {
			self.postMessage({
				blob,
				fileName: `export-${Math.round(x1)}-${Math.round(y1)}-${Math.round(x2)}-${Math.round(y2)}.png`
			});
			self.close();
		});
	}

	const maxXForDrawing = tiles.length;
	const maxYForDrawing = tiles[0].length;

	for (let x = 0; x < maxXForDrawing; x++) {
		for (let y = 0; y < maxYForDrawing; y++) {
			imgsCount++;
			const response = await fetch(tiles[x][y]);

			if (!response.ok) {
				if (imgsCount === imgsNumber) drawImgsAndDownloadFile();
				continue;
			}

			const blob = await response.blob();

			if (!blob) {
				if (imgsCount === imgsNumber) drawImgsAndDownloadFile();
				continue;
			}

			const bitmap = await createImageBitmap(blob);

			imgs.push({
				bitmap,
				x: x * TILE_PIXEL_SIZE - xOffset,
				y: height - TILE_PIXEL_SIZE - y * TILE_PIXEL_SIZE + yOffset
			});

			if (imgsCount === imgsNumber) drawImgsAndDownloadFile();
		}
	}
};

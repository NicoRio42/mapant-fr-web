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
			fetch(tiles[x][y])
				.then((response) => {
					if (!response.ok) {
						return null;
					}

					return response.blob();
				})
				.then((blob) => {
					if (!blob) {
						return null;
					}

					return createImageBitmap(blob);
				})
				.then((bitmap) => {
					if (bitmap === null) return;

					imgs.push({
						bitmap,
						x: x * TILE_PIXEL_SIZE - xOffset,
						y: height - TILE_PIXEL_SIZE - y * TILE_PIXEL_SIZE + yOffset
					});
				})
				.catch((e) => console.error(e))
				.finally(() => {
					imgsCount++;
					if (imgsCount === imgsNumber) drawImgsAndDownloadFile();
				});
		}
	}
};

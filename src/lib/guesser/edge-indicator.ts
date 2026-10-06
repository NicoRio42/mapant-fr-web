import type { Pixel } from 'ol/pixel.js';
import type { Size } from 'ol/size.js';

export interface EdgeIndicator {
	x: number;
	y: number;
	angle: number;
}

// Intersect the ray from the viewport centre to the offscreen point with an
// inset viewport, leaving room for the whole dot and arrow at edges and corners.
export function edgeIndicator(pixel: Pixel, size: Size, inset = 26): EdgeIndicator | null {
	const [x, y] = pixel;
	const [width, height] = size;
	if (
		![x, y, width, height].every(Number.isFinite) ||
		width <= inset * 2 ||
		height <= inset * 2 ||
		(x >= 0 && x <= width && y >= 0 && y <= height)
	) {
		return null;
	}
	const dx = x - width / 2;
	const dy = y - height / 2;
	const scale = Math.min((width / 2 - inset) / Math.abs(dx), (height / 2 - inset) / Math.abs(dy));
	return {
		x: width / 2 + dx * scale,
		y: height / 2 + dy * scale,
		angle: (Math.atan2(dy, dx) * 180) / Math.PI
	};
}

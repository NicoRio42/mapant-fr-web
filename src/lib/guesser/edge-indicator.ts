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

// Spread indicators along each edge so checkpoints in the same direction
// remain individually clickable, including alongside the start indicator.
export function edgeIndicators(pixels: Pixel[], size: Size, inset = 26): (EdgeIndicator | null)[] {
	const indicators = pixels.map((pixel) => edgeIndicator(pixel, size, inset));
	const edges: { index: number; axis: 'x' | 'y' }[][] = [[], [], [], []];
	indicators.forEach((indicator, index) => {
		if (!indicator) return;
		if (Math.abs(indicator.x - inset) < 1e-6) edges[0].push({ index, axis: 'y' });
		else if (Math.abs(indicator.x - (size[0] - inset)) < 1e-6) edges[1].push({ index, axis: 'y' });
		else if (Math.abs(indicator.y - inset) < 1e-6) edges[2].push({ index, axis: 'x' });
		else edges[3].push({ index, axis: 'x' });
	});
	for (const edge of edges) {
		if (edge.length < 2) continue;
		const axis = edge[0].axis;
		const maximum = size[axis === 'x' ? 0 : 1] - inset;
		const spacing = Math.min(48, (maximum - inset) / (edge.length - 1));
		edge.sort((a, b) => indicators[a.index]![axis] - indicators[b.index]![axis]);
		let previous = inset - spacing;
		for (const { index } of edge) {
			const indicator = indicators[index]!;
			indicator[axis] = Math.max(indicator[axis], previous + spacing);
			previous = indicator[axis];
		}
		let next = maximum + spacing;
		for (let i = edge.length - 1; i >= 0; i--) {
			const { index } = edge[i];
			const indicator = indicators[index]!;
			indicator[axis] = Math.min(indicator[axis], next - spacing);
			next = indicator[axis];
			indicator.angle =
				(Math.atan2(pixels[index][1] - indicator.y, pixels[index][0] - indicator.x) * 180) /
				Math.PI;
		}
	}
	return indicators;
}

import { describe, expect, it } from 'vitest';
import { edgeIndicator } from './edge-indicator.js';

describe('offscreen start indicator', () => {
	it.each([
		[0, 0],
		[400, 300],
		[800, 600],
		[1, 599]
	])('hides for visible point %j', (x, y) => {
		expect(edgeIndicator([x, y], [800, 600])).toBeNull();
	});

	it.each([
		{ pixel: [-100, 300], x: 26, y: 300, angle: 180 },
		{ pixel: [900, 300], x: 774, y: 300, angle: 0 },
		{ pixel: [400, -100], x: 400, y: 26, angle: -90 },
		{ pixel: [400, 700], x: 400, y: 574, angle: 90 }
	])('sticks to the edge toward $pixel', ({ pixel, x, y, angle }) => {
		expect(edgeIndicator(pixel, [800, 600])).toEqual({ x, y, angle });
	});

	it.each([
		[-100, -100],
		[900, -100],
		[-100, 700],
		[900, 700],
		[801, 1]
	])('keeps diagonal indicator inside the viewport and pointing toward %j', (x, y) => {
		const indicator = edgeIndicator([x, y], [800, 600])!;
		expect(indicator.x).toBeGreaterThanOrEqual(26);
		expect(indicator.x).toBeLessThanOrEqual(774);
		expect(indicator.y).toBeGreaterThanOrEqual(26);
		expect(indicator.y).toBeLessThanOrEqual(574);
		expect(
			Math.min(indicator.x - 26, 774 - indicator.x, indicator.y - 26, 574 - indicator.y)
		).toBeCloseTo(0);
		expect(indicator.angle).toBeCloseTo(
			(Math.atan2(y - indicator.y, x - indicator.x) * 180) / Math.PI
		);
	});

	it('adapts to a resized mobile viewport', () => {
		expect(edgeIndicator([400, 300], [800, 600])).toBeNull();
		expect(edgeIndicator([400, 300], [320, 600])).toEqual({ x: 294, y: 300, angle: 0 });
	});

	it.each([
		[1280, 512],
		[390, 585]
	])('lies on the centre-to-start ray at every angle in a %j × %j viewport', (width, height) => {
		const radius = Math.hypot(width, height);
		for (let degrees = 0; degrees < 360; degrees += 15) {
			const angle = (degrees * Math.PI) / 180;
			const dx = radius * Math.cos(angle);
			const dy = radius * Math.sin(angle);
			const indicator = edgeIndicator([width / 2 + dx, height / 2 + dy], [width, height])!;
			const ix = indicator.x - width / 2;
			const iy = indicator.y - height / 2;
			// Perpendicular distance to the ray must be zero, with the dot on the
			// target side of the centre and the arrow pointing along that same ray.
			expect(Math.abs(ix * dy - iy * dx) / radius).toBeLessThan(1e-9);
			expect(ix * dx + iy * dy).toBeGreaterThan(0);
			const arrowAngle = (indicator.angle * Math.PI) / 180;
			expect(Math.cos(arrowAngle)).toBeCloseTo(dx / radius);
			expect(Math.sin(arrowAngle)).toBeCloseTo(dy / radius);
		}
	});

	it('hides for unrendered or invalid map sizes and coordinates', () => {
		expect(edgeIndicator([900, 300], [0, 0])).toBeNull();
		expect(edgeIndicator([900, 300], [50, 600])).toBeNull();
		expect(edgeIndicator([NaN, 300], [800, 600])).toBeNull();
		expect(edgeIndicator([400, Infinity], [800, 600])).toBeNull();
	});
});

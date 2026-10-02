import { describe, expect, it } from 'vitest';
import { explorationStartResolution, explorationView } from './view.js';
import { MAX_PLAY_RESOLUTION, MIN_RESOLUTION, START_RESOLUTION } from './round.js';

describe('exploration view', () => {
	it('starts at native tile zoom 12 and prevents zooming out beyond it', () => {
		const view = explorationView([700000, 6600000]);
		expect(view.getResolution()).toBe(START_RESOLUTION);
		expect(MAX_PLAY_RESOLUTION).toBe(START_RESOLUTION);
		expect(view.getMinZoom()).toBe(view.getZoom());
		view.setResolution(1000);
		expect(view.getResolution()).toBe(START_RESOLUTION);
		view.setResolution(0.01);
		expect(view.getResolution()).toBe(MIN_RESOLUTION);
	});
	it('enforces the limit during an active pinch or wheel interaction', () => {
		const view = explorationView([700000, 6600000]);
		view.beginInteraction();
		view.adjustResolution(100);
		expect(view.getResolution()).toBe(START_RESOLUTION);
		view.adjustResolution(0.0001);
		expect(view.getResolution()).toBe(MIN_RESOLUTION);
		view.endInteraction(0);
	});
	it('shows twice the ground distance on mobile and enforces its zoom limits', () => {
		const view = explorationView([700000, 6600000], false, true);
		expect(explorationStartResolution(true)).toBe(START_RESOLUTION * 2);
		expect(view.getResolution()).toBe(explorationStartResolution(true));
		expect(view.getMinZoom()).toBe(11);
		view.setResolution(1000);
		expect(view.getResolution()).toBe(START_RESOLUTION * 2);
		view.beginInteraction();
		view.adjustResolution(100);
		expect(view.getResolution()).toBe(START_RESOLUTION * 2);
		view.adjustResolution(0.0001);
		expect(view.getResolution()).toBe(MIN_RESOLUTION);
		view.endInteraction(0);
	});
	it('adapts the zoom limit when switching between mobile and desktop widths', () => {
		const view = explorationView([700000, 6600000], false, true);
		view.setMinZoom(12);
		expect(view.getResolution()).toBe(START_RESOLUTION);
		view.setMinZoom(11);
		view.setResolution(explorationStartResolution(true));
		expect(view.getResolution()).toBe(START_RESOLUTION * 2);
	});
	it('allows zooming out after reveal', () => {
		const view = explorationView([700000, 6600000]);
		view.setMinZoom(0);
		view.setResolution(1000);
		expect(view.getResolution()).toBe(1000);
		expect(explorationView([700000, 6600000], true).getMaxResolution()).toBe(8000);
		expect(explorationView([700000, 6600000], true, true).getMaxResolution()).toBe(8000);
	});
});

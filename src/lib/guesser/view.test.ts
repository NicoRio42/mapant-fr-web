import { describe, expect, it } from 'vitest';
import { explorationView } from './view.js';
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
	it('allows zooming out after reveal', () => {
		const view = explorationView([700000, 6600000]);
		view.setMinZoom(0);
		view.setResolution(1000);
		expect(view.getResolution()).toBe(1000);
		expect(explorationView([700000, 6600000], true).getMaxResolution()).toBe(8000);
	});
});

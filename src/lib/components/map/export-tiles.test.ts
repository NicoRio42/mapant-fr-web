import { describe, expect, it } from 'vitest';
import {
	MAPANT_MAX_Y,
	MAPANT_MIN_X,
	MAPANT_MAX_ZOOM,
	MAPANT_RESOLUTIONS,
	MAPANT_TILE_SIZE
} from './mapant-tile-grid.js';
import { EXPORT_PRINT_DPI, EXPORT_PRINT_SCALE, getExportTiles } from './export-tiles.js';

const resolution = MAPANT_RESOLUTIONS[MAPANT_MAX_ZOOM];
const tileSpan = resolution * MAPANT_TILE_SIZE;
const exportMetersPerPixel = (EXPORT_PRINT_SCALE * 0.0254) / EXPORT_PRINT_DPI;
const exportScale = resolution / exportMetersPerPixel;

describe('getExportTiles', () => {
	it('uses the map grid and crops a selection spanning four tiles', () => {
		const tileLeft = MAPANT_MIN_X + 3 * tileSpan;
		const tileTop = MAPANT_MAX_Y - 4 * tileSpan;
		const extent = {
			x1: tileLeft + tileSpan / 4,
			x2: tileLeft + (3 * tileSpan) / 2,
			y1: tileTop - (3 * tileSpan) / 2,
			y2: tileTop - tileSpan / 4
		};

		const result = getExportTiles(extent, '/tiles', '?fresh');

		expect(result.width).toBe(Math.ceil((320 * resolution) / exportMetersPerPixel));
		expect(result.height).toBe(Math.ceil((320 * resolution) / exportMetersPerPixel));
		expect(result.scale).toBeCloseTo(exportScale);
		expect(result.tiles).toEqual([
			{ url: '/tiles/13/3/4.png?fresh', x: -64, y: -64 },
			{ url: '/tiles/13/3/5.png?fresh', x: -64, y: 192 },
			{ url: '/tiles/13/4/4.png?fresh', x: 192, y: -64 },
			{ url: '/tiles/13/4/5.png?fresh', x: 192, y: 192 }
		]);
	});

	it('does not add adjacent tiles at exact boundaries or depend on corner order', () => {
		const extent = {
			x1: MAPANT_MIN_X + 7 * tileSpan,
			x2: MAPANT_MIN_X + 6 * tileSpan,
			y1: MAPANT_MAX_Y - 8 * tileSpan,
			y2: MAPANT_MAX_Y - 7 * tileSpan
		};

		expect(getExportTiles(extent, '/tiles')).toEqual({
			scale: exportScale,
			width: Math.ceil(tileSpan / exportMetersPerPixel),
			height: Math.ceil(tileSpan / exportMetersPerPixel),
			tiles: [{ url: '/tiles/13/6/7.png', x: 0, y: 0 }]
		});
	});

	it('exports 1,000 ground meters at 600 dpi for 1:10,000 printing', () => {
		const result = getExportTiles(
			{ x1: MAPANT_MIN_X, x2: MAPANT_MIN_X + 1000, y1: MAPANT_MAX_Y - 1000, y2: MAPANT_MAX_Y },
			'/tiles'
		);

		expect(result.width).toBe(2363);
		expect(result.height).toBe(2363);
		expect(result.scale).toBeGreaterThan(1);
	});
});

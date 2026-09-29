import {
	MAPANT_MAX_Y,
	MAPANT_MIN_X,
	MAPANT_MAX_ZOOM,
	MAPANT_RESOLUTIONS,
	MAPANT_TILE_SIZE
} from './mapant-tile-grid.js';

export const EXPORT_PRINT_DPI = 600;
export const EXPORT_PRINT_SCALE = 10_000;

// At 1:10,000, each printed pixel represents this many ground meters.
const exportMetersPerPixel = (EXPORT_PRINT_SCALE * 0.0254) / EXPORT_PRINT_DPI;

export type ExportTile = { url: string; x: number; y: number };

export function getExportTiles(
	{ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number },
	baseUrl: string,
	cacheBust = ''
) {
	const minX = Math.min(x1, x2);
	const maxX = Math.max(x1, x2);
	const minY = Math.min(y1, y2);
	const maxY = Math.max(y1, y2);
	const resolution = MAPANT_RESOLUTIONS[MAPANT_MAX_ZOOM];
	const tileSpan = resolution * MAPANT_TILE_SIZE;
	const scale = resolution / exportMetersPerPixel;
	const tiles: ExportTile[] = [];

	const firstX = Math.floor((minX - MAPANT_MIN_X) / tileSpan);
	const lastX = Math.ceil((maxX - MAPANT_MIN_X) / tileSpan);
	const firstY = Math.floor((MAPANT_MAX_Y - maxY) / tileSpan);
	const lastY = Math.ceil((MAPANT_MAX_Y - minY) / tileSpan);

	for (let tileX = firstX; tileX < lastX; tileX++) {
		for (let tileY = firstY; tileY < lastY; tileY++) {
			tiles.push({
				url: `${baseUrl}/${MAPANT_MAX_ZOOM}/${tileX}/${tileY}.webp${cacheBust}`,
				x: (MAPANT_MIN_X + tileX * tileSpan - minX) / resolution,
				y: (maxY - (MAPANT_MAX_Y - tileY * tileSpan)) / resolution
			});
		}
	}

	return {
		tiles,
		scale,
		width: Math.ceil((maxX - minX) / exportMetersPerPixel),
		height: Math.ceil((maxY - minY) / exportMetersPerPixel)
	};
}

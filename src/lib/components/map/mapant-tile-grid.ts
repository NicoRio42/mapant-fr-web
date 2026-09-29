// The Mapant XYZ grid is in Lambert 93 (EPSG:2154).
// Preserve the offsets used by the displayed map when exporting tiles.
const OFFSET_X = 1001902.433647273 - 1002549.3574821977;
const OFFSET_Y = 6830472.450035284 - 6830938.372790006;

export const MAPANT_MIN_X = -343646 - OFFSET_X;
export const MAPANT_MAX_X = 1704354 - OFFSET_X;
export const MAPANT_MAX_Y = 7667537 - OFFSET_Y;
export const MAPANT_TILE_SIZE = 256;
export const MAPANT_MAX_ZOOM = 13;

const maxResolution = (MAPANT_MAX_X - MAPANT_MIN_X) / MAPANT_TILE_SIZE;

export const MAPANT_RESOLUTIONS = Array.from(
	{ length: MAPANT_MAX_ZOOM + 1 },
	(_, zoom) => maxResolution / 2 ** zoom
);

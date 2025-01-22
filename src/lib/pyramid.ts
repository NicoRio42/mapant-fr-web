/**
 * Constants computed to cover the whole metropolitan France
 */
const MIN_X = 343646;
const MAX_X = 1704354;
const MIN_Y = 5619537;
const MAX_Y = 7667537;
const BASE_TILE_LAMBERT_93_SIZE = 1000;
const MIN_ZOOM_LEVEL = 0;
const MAX_ZOOM_LEVEL = 13;
const BASE_ZOOM_LEVEL = 11;
// TODO see if it is not 2364
const BASE_TILE_IMAGE_PIXEL_SIZE = 2362;
const TILE_IMAGE_PIXEL_SIZE = 256;
const MAX_TILE_SIZE = BASE_TILE_LAMBERT_93_SIZE * Math.pow(2, BASE_ZOOM_LEVEL);

type PyramidJob = {
	x: number;
	y: number;
	z: number;
	isBaseZoomLevel: boolean;
	index: number;
};

export function getPyramidJobsFromTileList(
	tiles: { xLambert93: number; yLambert93: number }[]
): PyramidJob[] {
	let index = 0;
	let pyramidJobs: PyramidJob[] = [];
	const zooms: Record<number, PyramidJob[]> = {};

	// Base level
	zooms[BASE_ZOOM_LEVEL] = [];

	for (const { xLambert93, yLambert93 } of tiles) {
		const [x, y] = lambert93ToTileNum(xLambert93, yLambert93, BASE_ZOOM_LEVEL);
		zooms[BASE_ZOOM_LEVEL].push({ x, y, z: BASE_ZOOM_LEVEL, isBaseZoomLevel: true, index });
		index++;
	}

	pyramidJobs = [...pyramidJobs, ...zooms[BASE_ZOOM_LEVEL]];

	// Lower levels
	for (let zoomLevel = BASE_ZOOM_LEVEL - 1; zoomLevel >= MIN_ZOOM_LEVEL; zoomLevel--) {
		zooms[zoomLevel] = [];
		const zoomMap = new Map<string, { x: number; y: number }>();
		const childZoom = zooms[zoomLevel + 1];

		for (const childPyramidJob of childZoom) {
			const x = Math.floor(childPyramidJob.x / 2);
			const y = Math.floor(childPyramidJob.y / 2);

			zoomMap.set(`${x}_${y}`, { x, y });
		}

		zoomMap.forEach(({ x, y }) => {
			zooms[zoomLevel].push({ x, y, z: zoomLevel, isBaseZoomLevel: false, index });
			index++;
		});

		pyramidJobs = [...pyramidJobs, ...zooms[zoomLevel]];
	}

	return pyramidJobs;
}

function lambert93ToTileNum(x: number, y: number, zoom: number) {
	const xTile = Math.floor(((x - MIN_X) * Math.pow(2, zoom)) / MAX_TILE_SIZE);
	const yTile = Math.floor(((MAX_Y - y) * Math.pow(2, zoom)) / MAX_TILE_SIZE);
	return [xTile, yTile];
}

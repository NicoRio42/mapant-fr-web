import { View } from 'ol';
import type { Coordinate } from 'ol/coordinate.js';
import { MAPANT_RESOLUTIONS } from '../components/map/mapant-tile-grid.js';
import { START_RESOLUTION } from './round.js';

// Let the view overzoom native tiles up to OpenLayers' default view zoom.
// The tile source keeps its native grid and reuses its most detailed tiles.
const VIEW_RESOLUTIONS = Array.from({ length: 29 }, (_, zoom) => MAPANT_RESOLUTIONS[0] / 2 ** zoom);

export function explorationStartResolution(mobile = false): number {
	return START_RESOLUTION * (mobile ? 2 : 1);
}

export function explorationView(center: Coordinate, revealed = false, mobile = false): View {
	return new View({
		projection: 'EPSG:2154',
		center,
		resolution: explorationStartResolution(mobile),
		resolutions: VIEW_RESOLUTIONS,
		minZoom: revealed ? 0 : mobile ? 11 : 12,
		smoothResolutionConstraint: false
	});
}

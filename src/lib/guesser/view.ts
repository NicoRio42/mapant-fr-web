import { View } from 'ol';
import type { Coordinate } from 'ol/coordinate.js';
import { MAPANT_RESOLUTIONS } from '../components/map/mapant-tile-grid.js';
import { START_RESOLUTION } from './round.js';

export function explorationView(center: Coordinate, revealed = false): View {
	return new View({
		projection: 'EPSG:2154',
		center,
		resolution: START_RESOLUTION,
		resolutions: MAPANT_RESOLUTIONS,
		minZoom: revealed ? 0 : 12,
		maxZoom: 13,
		smoothResolutionConstraint: false
	});
}

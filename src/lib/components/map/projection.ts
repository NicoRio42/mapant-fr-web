import { register } from 'ol/proj/proj4.js';
import proj4 from 'proj4';

export function setupLambert93Projection() {
	const definition =
		'+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs';
	proj4.defs('EPSG:2154', definition);
	proj4.defs('IGNF:LAMB93', definition);
	register(proj4);
}

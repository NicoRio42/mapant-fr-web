import MultiPolygon from 'ol/geom/MultiPolygon.js';
import type { Coordinate } from 'ol/coordinate.js';
import { toLonLat } from 'ol/proj.js';
import { getDistance } from 'ol/sphere.js';
import {
	MAPANT_MAX_Y,
	MAPANT_MIN_X,
	MAPANT_MAX_ZOOM,
	MAPANT_RESOLUTIONS,
	MAPANT_TILE_SIZE
} from '../components/map/mapant-tile-grid.js';
import { setupLambert93Projection } from '../components/map/projection.js';
import boundary from './france-boundary.json';

setupLambert93Projection();

// Natural Earth 1:50m, public domain. See docs/mapant-guesser.md for provenance.
const france = new MultiPolygon(boundary.coordinates).transform('EPSG:4326', 'EPSG:2154');
const bounds = france.getExtent();
export const START_RESOLUTION = MAPANT_RESOLUTIONS[12];
export const MAX_PLAY_RESOLUTION = START_RESOLUTION;

export function isInFrance(point: Coordinate): boolean {
	return france.intersectsCoordinate(point);
}

export function sampleLocation(random = Math.random): Coordinate {
	for (let attempt = 0; attempt < 1000; attempt++) {
		const point = [
			bounds[0] + random() * (bounds[2] - bounds[0]),
			bounds[1] + random() * (bounds[3] - bounds[1])
		];
		if (isInFrance(point)) return point;
	}
	throw new Error('Impossible de choisir un lieu en France. Réessayez.');
}

export function targetTile(point: Coordinate): [number, number, number] {
	const span = MAPANT_RESOLUTIONS[MAPANT_MAX_ZOOM] * MAPANT_TILE_SIZE;
	return [
		MAPANT_MAX_ZOOM,
		Math.floor((point[0] - MAPANT_MIN_X) / span),
		Math.floor((MAPANT_MAX_Y - point[1]) / span)
	];
}

export async function findCoveredLocation({
	baseUrl,
	signal,
	fetchTile = fetch,
	sample = sampleLocation,
	maxAttempts = 30,
	timeoutMs = 20_000
}: {
	baseUrl: string;
	signal: AbortSignal;
	fetchTile?: typeof fetch;
	sample?: () => Coordinate;
	maxAttempts?: number;
	timeoutMs?: number;
}): Promise<Coordinate> {
	const controller = new AbortController();
	const abort = () => controller.abort(signal.reason);
	signal.addEventListener('abort', abort, { once: true });
	if (signal.aborted) abort();
	const timeout = setTimeout(
		() => controller.abort(new DOMException('Coverage search timed out', 'TimeoutError')),
		timeoutMs
	);
	async function exists(z: number, x: number, y: number) {
		controller.signal.throwIfAborted();
		const response = await fetchTile(`${baseUrl}/${z}/${x}/${y}.webp`, {
			method: 'HEAD',
			signal: controller.signal
		});
		if (response.status === 200) return true;
		if (response.status === 204 || response.status === 404) return false;
		throw new Error(`Le serveur de cartes est indisponible (HTTP ${response.status}). Réessayez.`);
	}
	try {
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			controller.signal.throwIfAborted();
			const point = sample();
			const [z, x, y] = targetTile(point);
			if (!(await exists(z, x, y))) continue;
			// Test the centre first to avoid eight unnecessary requests on an absent tile.
			const neighbours: Promise<boolean>[] = [];
			for (let dx = -1; dx <= 1; dx++) {
				for (let dy = -1; dy <= 1; dy++) {
					if (dx || dy) neighbours.push(exists(z, x + dx, y + dy));
				}
			}
			if ((await Promise.all(neighbours)).every(Boolean)) {
				controller.signal.throwIfAborted();
				return point;
			}
		}
		throw new Error(
			'Aucun lieu suffisamment couvert trouvé. Réessayez pour une nouvelle recherche.'
		);
	} catch (error) {
		if (signal.aborted) throw signal.reason;
		if (controller.signal.reason?.name === 'TimeoutError') {
			throw new Error('La recherche a pris trop de temps. Vérifiez votre connexion et réessayez.');
		}
		if (error instanceof TypeError) {
			throw new Error(
				'Impossible de joindre le serveur de cartes. Vérifiez votre connexion et réessayez.'
			);
		}
		throw error;
	} finally {
		clearTimeout(timeout);
		signal.removeEventListener('abort', abort);
		controller.abort();
	}
}

export function guessDistance(target: Coordinate, guessLonLat: Coordinate): number {
	return getDistance(toLonLat(target, 'EPSG:2154'), guessLonLat);
}

export function formatDistance(metres: number): string {
	return metres < 1000
		? `${Math.round(metres).toLocaleString('fr-FR')} m`
		: `${(metres / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
}

import { dev } from '$app/env';

export const MAPANT_TILES_BASE_URL = dev ? 'http://[::]:8080/data/mapant' : '/api/tiles';

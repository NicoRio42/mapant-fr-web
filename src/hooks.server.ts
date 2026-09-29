import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	// Workers Cache is enabled for the Worker. Only explicitly cacheable responses
	// (such as PMTiles tiles) should be stored; avoid heuristic caching of pages/errors.
	if (!response.headers.has('Cache-Control')) {
		response.headers.set('Cache-Control', 'no-store');
	}
	return response;
};

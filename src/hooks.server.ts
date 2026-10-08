import type { Handle } from '@sveltejs/kit/hooks';
import { dev } from '$app/env';
import { env } from 'cloudflare:workers';
import { resolveUser } from '#lib/server/guesser/security.js';

export const handle: Handle = async ({ event, resolve }) => {
	// Capture before any asynchronous database/session work.
	event.locals.receivedAt = Date.now();
	event.locals.user = null;
	if (
		event.url.pathname === '/login' ||
		event.url.pathname.startsWith('/guesser') ||
		event.url.pathname.startsWith('/api/guesser')
	) {
		if (
			!['GET', 'HEAD', 'OPTIONS'].includes(event.request.method) &&
			event.request.headers.get('origin') !== event.url.origin
		) {
			return Response.json(
				{ message: 'Origine de requête refusée.' },
				{ status: 403, headers: { 'Cache-Control': 'no-store' } }
			);
		}
		event.locals.user = await resolveUser(env, event.cookies, dev, event.locals.receivedAt);
	}
	const response = await resolve(event);
	if (!response.headers.has('Cache-Control')) response.headers.set('Cache-Control', 'no-store');
	return response;
};

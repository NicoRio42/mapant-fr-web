import { auth } from '$lib/server/auth.js';
import { ADMIN_LOGIN } from '$env/static/private';

export const handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(auth.sessionCookieName);

	const url = new URL(event.request.url);
	console.log(`${event.request.method} request to ${url.pathname}`);

	if (url.pathname.startsWith('/admin')) {
		if (!ADMIN_LOGIN) return new Response(null, { status: 500 });
		const basicAuth = event.request.headers.get('Authorization');

		if (basicAuth !== `Basic ${btoa(ADMIN_LOGIN)}`) {
			return new Response('Not authorized', {
				status: 401,
				headers: {
					'WWW-Authenticate': 'Basic realm="User Visible Realm", charset="UTF-8"'
				}
			});
		}
	}

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSession(sessionId);

	if (session && session.fresh) {
		const sessionCookie = auth.createSessionCookie(session.id);

		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	if (!session) {
		const sessionCookie = auth.createBlankSessionCookie();

		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	event.locals.user = user;
	event.locals.session = session;

	return await resolve(event);
};

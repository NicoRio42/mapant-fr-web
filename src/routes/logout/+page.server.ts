import { getAuth } from '$lib/server/auth.js';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ locals, cookies }) => {
		if (!locals.session) {
			return fail(401);
		}

		const auth = getAuth();
		await auth.invalidateSession(locals.session.id);
		const sessionCookie = auth.createBlankSessionCookie();

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		redirect(302, '/');
	}
};

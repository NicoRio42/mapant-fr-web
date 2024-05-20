import { auth } from '$lib/server/auth.js';
import { db } from '$lib/server/db.js';
import { userTable } from '$lib/server/schema.js';
import { Scrypt } from '$lib/server/scrypt.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export async function load({ locals }) {
	if (locals.user !== null) redirect(302, '/contributions');
}

export const actions = {
	default: async ({ request, cookies, url }) => {
		const { email, password } = await extractEmailAndPasswordFromRequest(request);

		const existingUser = await db.select().from(userTable).where(eq(userTable.email, email)).get();

		if (existingUser === undefined) {
			return fail(400, { wrongPasswordOrEmail: true });
		}

		const isPasswordMatching = await new Scrypt().verify(existingUser.hashedPassword, password);

		if (!isPasswordMatching) {
			return fail(400, { wrongPasswordOrEmail: true });
		}

		const session = await auth.createSession(existingUser.id, {});
		const sessionCookie = auth.createSessionCookie(session.id);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		const redirectUrl = url.searchParams.get('redirect-url');

		if (redirectUrl !== null) {
			let decodedRedirectUrl: string | null = null;

			try {
				decodedRedirectUrl = decodeURIComponent(redirectUrl);
			} catch (e) {}

			if (decodedRedirectUrl !== null) {
				throw redirect(302, decodedRedirectUrl);
			}
		}

		throw redirect(302, '/contributions');
	}
};

async function extractEmailAndPasswordFromRequest(request: Request) {
	const formData = await request.formData();

	const email = formData.get('email');
	if (typeof email !== 'string') throw error(400);

	const password = formData.get('password');
	if (typeof password !== 'string') throw error(400);

	return { email, password };
}

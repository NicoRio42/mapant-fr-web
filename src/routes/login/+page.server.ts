import { auth } from '$lib/server/auth.js';
import { getDb } from '$lib/server/db.js';
import { userTable } from '$lib/server/schema.js';
import { Scrypt } from '$lib/server/scrypt.js';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { loginSchema } from './login-schema.js';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export async function load({ locals }) {
	if (locals.user !== null) redirect(302, '/contributions');
	const form = await superValidate(zod(loginSchema));

	return { form };
}

export const actions = {
	default: async ({ request, cookies, url }) => {
		const form = await superValidate(request, zod(loginSchema));
		if (!form.valid) throw error(400);
		const { email, password } = form.data;

		const db = getDb();
		const existingUser = await db.select().from(userTable).where(eq(userTable.email, email)).get();

		if (existingUser === undefined) {
			return setError(
				form,
				'',
				'Aucun compte ne correspond à cette adresse email et à ce mot de passe. Si vous avez oublié votre mot de passe envoyez un mail à contact@mapant.fr'
			);
		}

		const isPasswordMatching = await new Scrypt().verify(existingUser.hashedPassword, password);

		if (!isPasswordMatching) {
			return setError(
				form,
				'',
				'Aucun compte ne correspond à cette adresse email et à ce mot de passe. Si vous avez oublié votre mot de passe envoyez un mail à contact@mapant.fr'
			);
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

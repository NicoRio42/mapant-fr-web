import { auth } from '$lib/server/auth.js';
import { getDb } from '$lib/server/db.js';
import { userTable } from '$lib/server/schema.js';
import { Scrypt } from '$lib/server/scrypt.js';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { signUpSchema } from './signup-schema.js';

export async function load({ locals }) {
	if (locals.user !== null) throw redirect(302, '/contribute/step-2');
	const form = await superValidate(zod(signUpSchema));

	return { form };
}

export const actions = {
	default: async ({ request, cookies, locals }) => {
		if (locals.user !== null) throw redirect(302, '/contribute/step-2');

		const form = await superValidate(request, zod(signUpSchema));
		const { email, password, keepInTouch } = form.data;

		const db = getDb();
		const existingUser = await db.select().from(userTable).where(eq(userTable.email, email)).get();

		if (existingUser !== undefined) {
			return setError(
				form,
				'email',
				'Cette adresse email est déjà utilisée, connectez vous avec votre compte ! Si vous avez oublié votre mot de passe envoyez un mail à contact@mapant.fr'
			);
		}

		const hashedPassword = await new Scrypt().hash(password);

		const [newUser] = await db
			.insert(userTable)
			.values({ hashedPassword, email, allowedSendingEmail: keepInTouch })
			.returning();

		const session = await auth.createSession(newUser.id, {});
		const sessionCookie = auth.createSessionCookie(session.id);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		throw redirect(302, '/contribute/step-2');
	}
};

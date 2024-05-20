import { auth } from '$lib/server/auth.js';
import { db } from '$lib/server/db.js';
import { userTable } from '$lib/server/schema.js';
import { Scrypt } from '$lib/server/scrypt.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export async function load({ locals }) {
	if (locals.user !== null) throw redirect(302, '/contribute/step-2');
}

export const actions = {
	default: async ({ request, cookies, locals }) => {
		if (locals.user !== null) throw redirect(302, '/contribute/step-2');

		const { email, password, keepInTouch } = await extractAndValidateFormData(request);

		const existingUser = await db.select().from(userTable).where(eq(userTable.email, email)).get();

		if (existingUser !== undefined) {
			return fail(400, { emailAlllreadyUsed: true });
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

async function extractAndValidateFormData(request: any) {
	const formData = await request.formData();

	const email = formData.get('email');
	if (typeof email !== 'string') throw error(400);

	const password = formData.get('password');
	if (typeof password !== 'string' || password.length < 12 || password.length > 20) {
		throw error(400);
	}

	const keepInTouch = formData.get('keep-in-touch') === 'on';
	return { email, password, keepInTouch };
}

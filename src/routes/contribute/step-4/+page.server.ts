import { db } from '$lib/server/db.js';
import { contributionTable } from '$lib/server/schema.js';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export async function load({ locals }) {
	if (locals.user === null) throw redirect(302, `/login?redirectUrl=/contribute/step-4`);

	const contributions = await db
		.select()
		.from(contributionTable)
		.where(eq(contributionTable.fkUser, locals.user.id))
		.all();

	return { contributions };
}

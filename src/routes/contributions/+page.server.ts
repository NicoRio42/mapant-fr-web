import { getDb } from '$lib/server/db.js';
import { contributionTable, contributionWithoutCompensationTable } from '$lib/server/schema.js';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export async function load({ locals }) {
	if (locals.user === null) throw redirect(302, `/login?redirect-url=/contributions`);

	const db = getDb();

	const contributions = await db
		.select()
		.from(contributionTable)
		.where(eq(contributionTable.fkUser, locals.user.id))
		.all();

	const contributionsWithoutCompensation = await db
		.select()
		.from(contributionWithoutCompensationTable)
		.where(eq(contributionWithoutCompensationTable.fkUser, locals.user.id))
		.all();

	return { contributions, contributionsWithoutCompensation };
}

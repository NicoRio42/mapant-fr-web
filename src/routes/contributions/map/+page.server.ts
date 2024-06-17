import { dev } from '$app/environment';
import { db } from '$lib/server/db.js';
import { contributionTable } from '$lib/server/schema.js';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export async function load({ locals }) {
	if (!dev && locals.user?.id !== 'hcoyztuvvx545fl') throw redirect(302, '/contributions');

	const contributions = await db
		.select()
		.from(contributionTable)
		.where(eq(contributionTable.paied, true))
		.all();

	return { contributions };
}

import { db } from '$lib/server/db.js';
import { contributionTable } from '$lib/server/schema.js';
import { error, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

export async function load({ locals, params, url }) {
	if (locals.user === null) {
		throw redirect(302, `/login?redirect-url=${encodeURIComponent(url.pathname)}`);
	}

	const contribution = await db
		.select()
		.from(contributionTable)
		.where(
			and(
				eq(contributionTable.id, params.contributionId),
				eq(contributionTable.fkUser, locals.user.id)
			)
		)
		.get();

	if (contribution == undefined) throw error(404);

	return { contribution };
}

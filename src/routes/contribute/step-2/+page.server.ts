import { CONTRIBUTION_FORMULAS } from '$lib/constants.js';
import { getDb } from '$lib/server/db.js';
import { contributionWithoutCompensationTable } from '$lib/server/schema.js';
import { error, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const formulaId = formData.get('formula');
		if (typeof formulaId !== 'string') throw error(400);
		const formula = CONTRIBUTION_FORMULAS.find((cont) => cont.id === formulaId);
		if (formula === undefined) throw error(400);

		const db = getDb();

		const [newContribution] = await db
			.insert(contributionWithoutCompensationTable)
			.values({ formula: formula.id, fkUser: locals.user === null ? null : locals.user.id })
			.returning();

		const paiementLinkUrl = `${formula.paiementLink}?client_reference_id=${newContribution.id}`;
		throw redirect(303, paiementLinkUrl);
	}
};

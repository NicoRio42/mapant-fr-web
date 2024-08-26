import { CONTRIBUTION_FORMULAS } from '$lib/constants.js';
import { db } from '$lib/server/db.js';
import { contributionWithoutCompensationTable } from '$lib/server/schema.js';
import { error, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (locals.user === null) throw redirect(302, '/contribute/step-1');
}

export const actions = {
	default: async ({ request, locals }) => {
		if (locals.user === null) throw redirect(302, '/contribute/step-1');
		const formData = await request.formData();
		const formulaId = formData.get('formula');
		if (typeof formulaId !== 'string') throw error(400);
		const formula = CONTRIBUTION_FORMULAS.find((cont) => cont.id === formulaId);
		if (formula === undefined) throw error(400);

		const [newContribution] = await db
			.insert(contributionWithoutCompensationTable)
			.values({ formula: formula.id, fkUser: locals.user.id })
			.returning();

		const paiementLinkUrl = `${formula.paiementLink}?client_reference_id=${newContribution.id}`;
		throw redirect(303, paiementLinkUrl);
	}
};

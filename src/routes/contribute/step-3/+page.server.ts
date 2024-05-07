import { STRIPE_CHECKOUT_LINKS } from '$lib/constants.js';
import { db } from '$lib/server/db.js';
import { contributionTable, type Contribution } from '$lib/server/schema.js';
import { error, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (locals.user === null) throw redirect(302, '/contribute/step-1');
}

export const actions = {
	default: async ({ locals, request, url }) => {
		if (locals.user === null) throw redirect(302, '/contribute/step-1');

		const formData = await request.formData();
		const minX = parseFormDataNumber(formData, 'minX');
		const minY = parseFormDataNumber(formData, 'minY');
		const maxX = parseFormDataNumber(formData, 'maxX');
		const maxY = parseFormDataNumber(formData, 'maxY');

		const formula = url.searchParams.get('formula');
		if (!isFormula(formula)) throw error(400);

		const [newContribution] = await db
			.insert(contributionTable)
			.values({ fkUser: locals.user.id, formula, minX, minY, maxX, maxY })
			.returning();

		const paiementLinkUrl = `${STRIPE_CHECKOUT_LINKS[formula]}?client_reference_id=${newContribution.id}`;

		throw redirect(303, paiementLinkUrl);
	}
};

function isFormula(formula: string | null): formula is Contribution['formula'] {
	return contributionTable.formula.enumValues.includes(formula as any);
}

function parseFormDataNumber(formData: FormData, key: string): number {
	const rawValue = formData.get(key);
	if (typeof rawValue !== 'string') throw error(400);
	const numberValue = parseFloat(rawValue);
	if (isNaN(numberValue)) throw error(400);
	return numberValue;
}

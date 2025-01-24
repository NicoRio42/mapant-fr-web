import { CONTRIBUTION_FORMULAS } from '$lib/constants.js';
import { getDb } from '$lib/server/db.js';
import { contributionTable } from '$lib/server/schema.js';
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

		const formulaId = url.searchParams.get('formula');
		const formula = CONTRIBUTION_FORMULAS.find((f) => f.id === formulaId);
		if (formula === undefined) throw error(400);

		const db = getDb();

		const [newContribution] = await db
			.insert(contributionTable)
			.values({ fkUser: locals.user.id, formula: formula.id, minX, minY, maxX, maxY })
			.returning();

		const paiementLinkUrl = `${formula.paiementLink}?client_reference_id=${newContribution.id}`;

		throw redirect(303, paiementLinkUrl);
	}
};

function parseFormDataNumber(formData: FormData, key: string): number {
	const rawValue = formData.get(key);
	if (typeof rawValue !== 'string') throw error(400);
	const numberValue = parseFloat(rawValue);
	if (isNaN(numberValue)) throw error(400);
	return numberValue;
}

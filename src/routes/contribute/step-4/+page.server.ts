import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (locals.user === null) throw redirect(302, `/login?redirect-url=/contribute/step-4`);
}

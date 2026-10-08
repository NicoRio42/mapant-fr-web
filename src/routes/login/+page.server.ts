import { loginDestination } from '#lib/guesser/login.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => ({
	user: locals.user,
	returnTo: loginDestination(url.searchParams.get('returnTo'))
});

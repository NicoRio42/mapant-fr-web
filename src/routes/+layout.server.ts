import { auth } from '$lib/server/auth.js';
import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	return { isUserConnected: locals.user !== null };
}

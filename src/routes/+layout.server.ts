export async function load({ locals }) {
	return { isUserConnected: locals.user !== null };
}

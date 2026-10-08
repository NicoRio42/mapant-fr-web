import { env } from 'cloudflare:workers';
import { database } from '#lib/server/guesser/db.js';
import { leaderboard } from '#lib/server/guesser/leaderboard.js';
export const load = async ({ locals }: { locals: App.Locals }) => {
	try {
		return { ...(await leaderboard(database(env), locals.user?.id)), error: null };
	} catch {
		return {
			leaders: [],
			current: null,
			error: 'Le classement est momentanément indisponible. Réessayez dans quelques instants.'
		};
	}
};

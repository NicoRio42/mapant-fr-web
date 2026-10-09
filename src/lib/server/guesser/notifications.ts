import { sql, type SQL } from 'drizzle-orm';
import type { Database, GuesserEnv } from './db.js';
import { leaderboardEmail, sendEmail } from './email.js';
import { rankedGames } from './leaderboard.js';

interface LeaderNotification {
	email: string;
	challenger: string;
}

// Select immediately before publishing the eligible candidate in the same atomic D1 batch.
// Completed/claimed games are no longer eligible, so repeated requests return no recipients.
export function leaderNotifications(db: Database, candidate: SQL) {
	return db.all<LeaderNotification>(sql`${rankedGames}, candidate as (${candidate})
 select u.email,challenger.pseudonym as challenger
 from candidate c cross join ranked r
 join users u on u.id=r.user_id join users challenger on challenger.id=c.user_id
 where r.rank=1 and r.user_id<>c.user_id
 and (c.total_points>r.total_points or (c.total_points=r.total_points and c.total_time<r.total_time))`);
}

export async function sendLeaderNotifications(
	env: GuesserEnv,
	local: boolean,
	recipients: LeaderNotification[]
) {
	for (const recipient of recipients) {
		try {
			await sendEmail(env, local, recipient.email, leaderboardEmail(recipient.challenger));
		} catch {
			// Best effort only: preserve the saved score, never retry or log recipient details.
			console.error('guesser_leaderboard_email_failed');
		}
	}
}

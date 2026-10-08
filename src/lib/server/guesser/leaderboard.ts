import { sql } from 'drizzle-orm';
import type { Database } from './db.js';
import type { Leader } from '../../guesser/protocol.js';
// Pick one whole game per player BEFORE ranking. Dates and IDs break display ties only.
export const rankedGames = sql`with best as (
 select user_id,id,total_points,total_time,completed_at,
 row_number() over (partition by user_id order by total_points desc,total_time asc,completed_at asc,id asc) as choice
 from games where status='completed' and user_id is not null
), ranked as (
 select user_id,id,total_points,total_time,completed_at,
 rank() over (order by total_points desc,total_time asc) as rank
 from best where choice=1
)`;
const publicColumns = sql`rank,u.pseudonym,r.total_points as points,r.total_time as time,r.completed_at as date,r.id as gameId`;
export async function leaderboard(db: Database, userId?: string) {
	const leaders = await db.all<Leader>(
		sql`${rankedGames} select ${publicColumns} from ranked r join users u on u.id=r.user_id order by rank,date,gameId limit 100`
	);
	const current = userId
		? await db.get<Leader>(
				sql`${rankedGames} select ${publicColumns} from ranked r join users u on u.id=r.user_id where r.user_id=${userId}`
			)
		: null;
	return { leaders, current: current ?? null };
}

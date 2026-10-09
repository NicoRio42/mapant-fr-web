import { sql } from 'drizzle-orm';
import { database, conflict, GuesserError, type GuesserEnv } from './db.js';
import {
	elapsed,
	GRACE_MS,
	withinDeadline,
	type SavedGame,
	type SavedRound
} from '../../guesser/protocol.js';
import { scoreDistance } from '../../guesser/game.js';
import { findCoveredLocation, guessDistance } from '../../guesser/round.js';
import { serveMapantTile } from '../mapant-pmtiles.js';
import { leaderboard } from './leaderboard.js';
import { leaderNotifications, sendLeaderNotifications } from './notifications.js';
export interface Owner {
	userId: string | null;
	guestHash: string | null;
}
interface GameRow {
	id: string;
	user_id: string | null;
	guest_hash: string | null;
	status: 'playing' | 'completed';
	total_points: number;
	total_time: number;
	claim_until: number | null;
}
interface RoundRow {
	id: string;
	game_id: string;
	number: number;
	target_x: number;
	target_y: number;
	started_at: number;
	deadline_at: number;
	guess_lon: number | null;
	guess_lat: number | null;
	received_at: number | null;
	distance: number | null;
	points: number | null;
	elapsed_ms: number | null;
	submission_id: string | null;
}
export class GameService {
	private db;
	constructor(
		private env: GuesserEnv,
		private owner: Owner,
		private pick = () => pickLocation(env),
		private local = false
	) {
		this.db = database(env);
	}
	private async owned(id: string) {
		const g = await this.db.get<GameRow>(sql`select * from games where id=${id}`);
		if (
			!g ||
			(g.user_id
				? g.user_id !== this.owner.userId
				: !this.owner.guestHash || g.guest_hash !== this.owner.guestHash)
		)
			throw new GuesserError(404, 'Partie introuvable ou inaccessible.');
		return g;
	}
	async create(now: number) {
		if (!this.owner.userId && !this.owner.guestHash)
			throw new GuesserError(401, 'Cookies nécessaires pour jouer.');
		const id = crypto.randomUUID();
		await this.db.run(
			sql`insert into games (id,guest_hash,user_id,created_at) values (${id},${this.owner.userId ? null : this.owner.guestHash},${this.owner.userId},${now})`
		);
		return this.read(id, now);
	}
	private totals(id: string, now: number) {
		return [
			leaderNotifications(
				this.db,
				sql`
    select g.user_id,sum(r.points) as total_points,sum(r.elapsed_ms) as total_time
    from games g join game_rounds r on r.game_id=g.id
    where g.id=${id} and g.status='playing' and g.user_id is not null
    group by g.id having count(r.received_at)=5`
			),
			this.db.run(sql`update games set
   total_points=(select coalesce(sum(points),0) from game_rounds where game_id=${id}),
   total_time=(select coalesce(sum(elapsed_ms),0) from game_rounds where game_id=${id}),
   status=case when (select count(*) from game_rounds where game_id=${id} and received_at is not null)=5 then 'completed' else 'playing' end,
   completed_at=case when (select count(*) from game_rounds where game_id=${id} and received_at is not null)=5 then ${now} else null end,
   claim_until=case when (select count(*) from game_rounds where game_id=${id} and received_at is not null)=5 then ${now + 86400000} else null end
   where id=${id} and status='playing'`)
		] as const;
	}
	private async expire(id: string, now: number) {
		const [, recipients] = await this.db.batch([
			this.db.run(
				sql`update game_rounds set received_at=${now},points=0,elapsed_ms=300000,submission_id='timeout' where game_id=${id} and received_at is null and deadline_at+${GRACE_MS}<${now}`
			),
			...this.totals(id, now)
		]);
		await sendLeaderNotifications(this.env, this.local, recipients);
	}
	async read(id: string, now: number): Promise<SavedGame> {
		await this.owned(id);
		await this.expire(id, now);
		const g = await this.owned(id);
		const rows = await this.db.all<RoundRow>(
			sql`select * from game_rounds where game_id=${id} order by number`
		);
		const rounds: SavedRound[] = rows.map((r) => ({
			id: r.id,
			number: r.number,
			target: [r.target_x, r.target_y],
			startedAt: r.started_at,
			deadlineAt: r.deadline_at,
			...(r.received_at === null
				? {}
				: {
						guess: r.guess_lon === null ? undefined : [r.guess_lon, r.guess_lat!],
						receivedAt: r.received_at,
						distance: r.distance ?? undefined,
						points: r.points!,
						elapsedMs: r.elapsed_ms!,
						submissionId: r.submission_id!
					})
		}));
		const saved = g.status === 'completed' && !!g.user_id;
		const best = saved ? (await leaderboard(this.db, g.user_id!)).current : null;
		return {
			id,
			status: g.status,
			rounds,
			totalPoints: g.total_points,
			totalTime: g.total_time,
			serverTime: Date.now(),
			saved,
			personalBest: best?.gameId === id,
			claimUntil: g.claim_until,
			guestOwned: !g.user_id
		};
	}
	async next(id: string, expected: number, now: number) {
		await this.owned(id);
		await this.expire(id, now);
		const existing = await this.db.get<RoundRow>(
			sql`select * from game_rounds where game_id=${id} and number=${expected}`
		);
		if (existing) return this.read(id, Date.now());
		const g = await this.owned(id);
		const finished = await this.db.get<{ n: number }>(
			sql`select count(*) as n from game_rounds where game_id=${id} and received_at is not null`
		);
		if (
			g.status !== 'playing' ||
			!Number.isInteger(expected) ||
			expected < 1 ||
			expected > 5 ||
			expected !== finished!.n + 1
		)
			throw conflict();
		const target = await this.pick().catch((cause) => {
			throw new GuesserError(
				503,
				cause instanceof Error ? cause.message : 'Recherche de couverture impossible. Réessayez.'
			);
		});
		const startedAt = Date.now(); // Coverage is never charged to the player.
		const row = await this.db
			.get(sql`insert into game_rounds (id,game_id,number,target_x,target_y,started_at,deadline_at)
   select ${crypto.randomUUID()},${id},${expected},${target[0]},${target[1]},${startedAt},${startedAt + 300000}
   where exists(select 1 from games where id=${id} and status='playing')
   and (select count(*) from game_rounds where game_id=${id} and received_at is not null)=${expected - 1}
   on conflict(game_id,number) do nothing returning id`);
		if (
			!row &&
			!(await this.db.get(
				sql`select id from game_rounds where game_id=${id} and number=${expected}`
			))
		)
			throw conflict();
		return this.read(id, Date.now());
	}
	async submit(
		id: string,
		roundId: string,
		submissionId: string,
		guess: unknown,
		receivedAt: number
	) {
		await this.owned(id);
		if (!/^[a-f0-9-]{36}$/i.test(submissionId))
			throw new GuesserError(400, 'Identifiant de proposition invalide.');
		if (
			guess !== null &&
			(!Array.isArray(guess) ||
				guess.length !== 2 ||
				!guess.every((v) => typeof v === 'number' && Number.isFinite(v)) ||
				Math.abs(guess[0]) > 180 ||
				Math.abs(guess[1]) > 90)
		)
			throw new GuesserError(400, 'Coordonnées invalides.');
		const coordinate = guess as [number, number] | null;
		let r = await this.db.get<RoundRow>(
			sql`select * from game_rounds where game_id=${id} and id=${roundId}`
		);
		if (!r) throw conflict();
		if (r.received_at === null && withinDeadline(r.deadline_at, receivedAt)) {
			const distance = coordinate ? guessDistance([r.target_x, r.target_y], coordinate) : null;
			const [, recipients] = await this.db.batch([
				this.db.run(
					sql`update game_rounds set guess_lon=${coordinate?.[0] ?? null},guess_lat=${coordinate?.[1] ?? null},received_at=${receivedAt},distance=${distance},points=${distance === null ? 0 : scoreDistance(distance)},elapsed_ms=${coordinate ? elapsed(r.started_at, receivedAt) : 300000},submission_id=${submissionId} where id=${roundId} and received_at is null and deadline_at+${GRACE_MS}>=${receivedAt}`
				),
				...this.totals(id, receivedAt)
			]);
			await sendLeaderNotifications(this.env, this.local, recipients);
		} else if (r.received_at === null) await this.expire(id, receivedAt);
		r = (await this.db.get<RoundRow>(sql`select * from game_rounds where id=${roundId}`))!;
		if (
			r.submission_id !== 'timeout' &&
			(r.submission_id !== submissionId ||
				r.guess_lon !== (coordinate?.[0] ?? null) ||
				r.guess_lat !== (coordinate?.[1] ?? null))
		)
			throw conflict();
		if (!r.submission_id) throw conflict();
		return this.read(id, Date.now());
	}
	async claim(id: string, now: number) {
		if (!this.owner.userId || !this.owner.guestHash)
			throw new GuesserError(401, 'Connectez-vous dans le navigateur où vous avez joué.');
		const eligible = sql`id=${id} and guest_hash=${this.owner.guestHash} and user_id is null and status='completed' and claim_until>${now} and exists(select 1 from guest_sessions where token_hash=${this.owner.guestHash} and expires_at>${now})`;
		const [recipients, row] = await this.db.batch([
			leaderNotifications(
				this.db,
				sql`
    select ${this.owner.userId} as user_id,total_points,total_time from games where ${eligible}`
			),
			this.db.get(
				sql`update games set user_id=${this.owner.userId},claimed_at=${now} where ${eligible} returning id`
			)
		]);
		if (
			!row &&
			!(await this.db.get(
				sql`select id from games where id=${id} and user_id=${this.owner.userId} and guest_hash=${this.owner.guestHash} and claimed_at is not null`
			))
		)
			throw conflict();
		await sendLeaderNotifications(this.env, this.local, recipients);
		return this.read(id, now);
	}
}
export async function pickLocation(env: GuesserEnv) {
	const baseUrl = env.LOCAL_TILE_URL || 'https://tiles.internal';
	return findCoveredLocation({
		baseUrl,
		signal: new AbortController().signal,
		fetchTile: env.LOCAL_TILE_URL
			? fetch
			: async (input, init) => {
					const request = new Request(input, init);
					return serveMapantTile(
						request,
						new URL(request.url).pathname.slice(1),
						env.R2_BUCKET_MAPANT
					);
				}
	});
}

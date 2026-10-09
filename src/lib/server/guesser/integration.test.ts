import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { readFileSync, readdirSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { toLonLat } from 'ol/proj.js';
import { database, type GuesserEnv } from './db.js';
import { GameService } from './games.js';
import { AuthService } from './auth.js';
import { leaderboard, rankedGames } from './leaderboard.js';
import {
	cleanup,
	resolveUser,
	guest,
	rateLimit,
	releaseRateLimit,
	RATE_LIMIT_MS
} from './security.js';
import { leaderboardEmail, sendCode } from './email.js';
import { SESSION_MS } from '../../guesser/protocol.js';
let mf: Miniflare;
let env: GuesserEnv;
let db: ReturnType<typeof database>;
const target = [700000, 6600000];
const guess = toLonLat(target, 'EPSG:2154');
function cookieJar() {
	const values = new Map<string, string>();
	return {
		values,
		cookies: {
			get: (name: string) => values.get(name),
			set: (name: string, value: string) => values.set(name, value),
			delete: (name: string) => values.delete(name)
		} as unknown as Cookies
	};
}
async function user(id = 'u', name = id) {
	await db.run(
		sql`insert into users values (${id},${name},${name.toLowerCase()},${id + '@example.fr'},1,1)`
	);
}
async function guestGame() {
	const cookies = cookieJar().cookies;
	const key = await guest(env, cookies, true, Date.now(), true);
	const service = new GameService(env, { guestHash: key, userId: null }, async () => target);
	return { service, key, game: await service.create(Date.now()) };
}
async function challenge(auth: AuthService, input: Record<string, unknown>, now = Date.now()) {
	const log = vi.spyOn(console, 'info').mockImplementation(() => {});
	try {
		await auth.send(input, now);
		return String(log.mock.calls.at(-1)?.[0]).match(/: (\d{6})\n/)![1];
	} finally {
		log.mockRestore();
	}
}
beforeAll(async () => {
	mf = new Miniflare(
		convertV4MiniflareOptions({
			workers: [
				{
					name: 'test',
					modules: true,
					script: 'export default {fetch(){return new Response("ok")}}',
					d1Databases: ['DB'],
					compatibilityDate: '2026-09-29'
				}
			]
		})
	);
	env = {
		DB: (await mf.getD1Database('DB', 'test')) as unknown as GuesserEnv['DB'],
		AUTH_SECRET: 'test-secret-with-at-least-32-characters',
		EMAIL_MODE: 'console'
	};
	db = database(env);
	for (const dir of readdirSync('migrations').sort()) {
		const migration = readFileSync(`migrations/${dir}/migration.sql`, 'utf8');
		await env.DB.batch(
			migration
				.split('--> statement-breakpoint')
				.filter((s) => s.trim())
				.map((s) => env.DB.prepare(s))
		);
	}
}, 30000);
afterAll(async () => {
	await mf?.dispose();
});
beforeEach(async () => {
	for (const table of [
		'game_rounds',
		'games',
		'sessions',
		'auth_challenges',
		'guest_sessions',
		'rate_limits',
		'users'
	])
		await db.run(sql.raw(`delete from ${table}`));
});
describe('local D1 game authority', () => {
	it('starts once, rejects skipped rounds and duplicate/conflicting submissions', async () => {
		const { service, game } = await guestGame();
		await expect(service.next(game.id, 2, Date.now())).rejects.toMatchObject({ status: 409 });
		const starts = await Promise.all([
			service.next(game.id, 1, Date.now()),
			service.next(game.id, 1, Date.now())
		]);
		expect(starts[0].rounds[0].id).toBe(starts[1].rounds[0].id);
		const r = starts[0].rounds[0],
			id = crypto.randomUUID();
		const submissions = await Promise.all([
			service.submit(game.id, r.id, id, guess, r.startedAt + 1234),
			service.submit(game.id, r.id, id, guess, r.startedAt + 1240)
		]);
		expect(submissions[0].totalPoints).toBe(5000);
		expect(submissions[1].totalTime).toBe(submissions[0].totalTime);
		await expect(
			service.submit(game.id, r.id, crypto.randomUUID(), guess, r.startedAt + 1500)
		).rejects.toMatchObject({ status: 409 });
		await expect(
			service.submit(game.id, r.id, id, [0, 0], r.startedAt + 1500)
		).rejects.toMatchObject({ status: 409 });
		await expect(
			new GameService(env, { guestHash: 'wrong', userId: null }).read(game.id, Date.now())
		).rejects.toMatchObject({ status: 404 });
	});
	it('accepts grace boundary, charges five minutes, and finalizes later submissions with zero', async () => {
		const { service, game } = await guestGame();
		const state = await service.next(game.id, 1, Date.now());
		const r = state.rounds[0];
		const result = await service.submit(
			game.id,
			r.id,
			crypto.randomUUID(),
			guess,
			r.deadlineAt + 5000
		);
		expect(result.totalPoints).toBe(5000);
		expect(result.totalTime).toBe(300000);
		const next = await service.next(game.id, 2, Date.now());
		const second = next.rounds[1];
		const before = await service.read(game.id, second.deadlineAt + 5000);
		expect(before.rounds[1].points).toBeUndefined();
		const expired = await service.submit(
			game.id,
			second.id,
			crypto.randomUUID(),
			guess,
			second.deadlineAt + 5001
		);
		expect(expired.rounds[1].points).toBe(0);
		expect(expired.rounds[1].elapsedMs).toBe(300000);
	});
	it('preserves earlier results when coverage fails and races timeout against submit safely', async () => {
		const { service, game, key } = await guestGame();
		const state = await service.next(game.id, 1, Date.now());
		const r = state.rounds[0];
		await Promise.allSettled([
			service.submit(game.id, r.id, crypto.randomUUID(), guess, r.deadlineAt + 5000),
			service.read(game.id, r.deadlineAt + 5001)
		]);
		const once = await service.read(game.id, Date.now());
		expect([0, 5000]).toContain(once.totalPoints);
		expect(once.totalTime).toBe(300000);
		const failing = new GameService(env, { guestHash: key, userId: null }, async () => {
			throw new Error('coverage');
		});
		await expect(failing.next(game.id, 2, Date.now())).rejects.toThrow('coverage');
		expect((await service.read(game.id, Date.now())).rounds).toHaveLength(1);
	});
	it('completes five rounds and claims only this game once with both credentials', async () => {
		const { service, game, key } = await guestGame();
		for (let number = 1; number <= 5; number++) {
			const s = await service.next(game.id, number, Date.now());
			const r = s.rounds.at(-1)!;
			await service.submit(game.id, r.id, crypto.randomUUID(), guess, r.startedAt + number);
		}
		const completed = await service.read(game.id, Date.now());
		expect(completed.status).toBe('completed');
		expect(completed.totalPoints).toBe(25000);
		expect(completed.totalTime).toBe(15);
		expect((await leaderboard(db)).leaders).toHaveLength(0);
		await user();
		await user('other');
		const claimed = new GameService(env, { guestHash: key, userId: 'u' });
		const claims = await Promise.all([
			claimed.claim(game.id, Date.now()),
			claimed.claim(game.id, Date.now())
		]);
		expect(claims.every((g) => g.saved)).toBe(true);
		await expect(
			new GameService(env, { guestHash: key, userId: 'other' }).claim(game.id, Date.now())
		).rejects.toMatchObject({ status: 409 });
		expect((await leaderboard(db, 'u')).current?.points).toBe(25000);
		await expect(service.read(game.id, Date.now())).rejects.toMatchObject({ status: 404 });
	});
	it('expires claims and guest credentials without deleting games', async () => {
		const { service, game, key } = await guestGame();
		await user();
		await db.run(
			sql`update games set status='completed',completed_at=1,claim_until=2 where id=${game.id}`
		);
		await expect(
			new GameService(env, { guestHash: key, userId: 'u' }).claim(game.id, 3)
		).rejects.toMatchObject({ status: 409 });
		await cleanup(env, Date.now() + SESSION_MS + 1);
		expect(await db.get(sql`select id from games where id=${game.id}`)).toBeTruthy();
		expect(await db.get(sql`select * from guest_sessions`)).toBeUndefined();
	});
	it('ranks a whole best game, shares equal ranks, and returns a rank outside top 100', async () => {
		await env.DB.batch(
			Array.from({ length: 105 }, (_, i) =>
				env.DB.prepare('insert into users values (?,?,?,?,1,1)').bind(
					'u' + i,
					'u' + i,
					'u' + i,
					`u${i}@example.fr`
				)
			)
		);
		const statements = [];
		for (let i = 0; i < 105; i++)
			for (let j = 0; j < 20; j++)
				statements.push(
					env.DB.prepare(
						"insert into games(id,user_id,status,total_points,total_time,created_at,completed_at) values (?,?,'completed',?,?,1,?)"
					).bind(`g-${i}-${j}`, 'u' + i, j === 0 ? 10000 : 9000, i < 2 ? 100 : i + 100, j + 1)
				);
		for (let i = 0; i < statements.length; i += 100)
			await env.DB.batch(statements.slice(i, i + 100));
		const start = performance.now();
		const ranking = await leaderboard(db, 'u104');
		expect(ranking.leaders).toHaveLength(100);
		expect(ranking.leaders[0].rank).toBe(1);
		expect(ranking.leaders[1].rank).toBe(1);
		expect(ranking.leaders[2].rank).toBe(3);
		expect(ranking.current?.rank).toBe(105);
		expect(ranking.current?.time).toBe(204);
		const plan = await db.all<{ detail: string }>(
			sql`explain query plan ${rankedGames} select * from ranked`
		);
		expect(plan.some((p) => p.detail.includes('games_best_rank'))).toBe(true);
		console.info(
			`Leaderboard: 2,100 games, ${Math.round(performance.now() - start)} ms (local D1 including query plan).`
		);
	}, 30000);
});
describe('leaderboard loss notifications', () => {
	let send = vi.fn<NonNullable<GuesserEnv['EMAIL']>['send']>();
	let mailEnv: GuesserEnv;
	let local: boolean;
	beforeEach(() => {
		send = vi.fn().mockResolvedValue(undefined);
		mailEnv = {
			...env,
			EMAIL_MODE: 'cloudflare',
			EMAIL_FROM: 'noreply@mapant.fr',
			EMAIL: { send }
		};
		local = false;
	});
	async function rankedUser(id: string, points: number, time: number) {
		await user(id);
		await db.run(sql`insert into games (id,user_id,status,total_points,total_time,created_at,completed_at)
   values (${id + '-best'},${id},'completed',${points},${time},1,1)`);
	}
	async function claimable(points: number, time: number, userId = 'challenger') {
		const { game, key } = await guestGame();
		await db.run(
			sql`update games set status='completed',total_points=${points},total_time=${time},completed_at=${Date.now()},claim_until=${Date.now() + 86400000} where id=${game.id}`
		);
		return {
			game,
			service: new GameService(mailEnv, { guestHash: key, userId }, undefined, local)
		};
	}
	it.each([
		['higher points', 10001, 1000, 1],
		['faster equal score', 10000, 99, 1],
		['exact tie', 10000, 100, 0],
		['slower equal score', 10000, 101, 0],
		['lower points despite faster time', 9999, 1, 0]
	])('handles a claimed game with %s', async (_, points, time, count) => {
		await rankedUser('leader', 10000, 100);
		await user('challenger');
		const { game, service } = await claimable(points as number, time as number);
		const results = await Promise.all([
			service.claim(game.id, Date.now()),
			service.claim(game.id, Date.now())
		]);
		expect(results.every((g) => g.saved)).toBe(true);
		await service.claim(game.id, Date.now());
		await service.read(game.id, Date.now());
		expect(send).toHaveBeenCalledTimes(count as number);
		if (count)
			expect(send).toHaveBeenCalledWith(
				expect.objectContaining({
					to: 'leader@example.fr',
					text: expect.stringContaining('challenger')
				})
			);
	});
	it('does not notify for the first player or their own improved record', async () => {
		await user('challenger');
		for (const points of [10000, 11000]) {
			const { game, service } = await claimable(points, 100);
			await service.claim(game.id, Date.now());
		}
		expect(send).not.toHaveBeenCalled();
	});
	it('notifies every dethroned co-leader, but never the challenger or lower ranks', async () => {
		await rankedUser('a', 10000, 100);
		await rankedUser('b', 10000, 100);
		await rankedUser('challenger', 10000, 100);
		await rankedUser('lower', 9000, 100);
		const { game, service } = await claimable(10000, 99);
		await service.claim(game.id, Date.now());
		expect(send.mock.calls.map(([message]) => message.to).sort()).toEqual([
			'a@example.fr',
			'b@example.fr'
		]);
	});
	it.each([false, true])(
		'sends once on signed-in completion (last round timeout: %s)',
		async (timeout) => {
			await rankedUser('leader', 10000, 100);
			await user('challenger');
			const service = new GameService(
				mailEnv,
				{ guestHash: null, userId: 'challenger' },
				async () => target
			);
			const game = await service.create(Date.now());
			for (let number = 1; number <= 5; number++) {
				const state = await service.next(game.id, number, Date.now());
				const r = state.rounds.at(-1)!;
				if (number === 5 && timeout) {
					await Promise.all([
						service.read(game.id, r.deadlineAt + 5001),
						service.read(game.id, r.deadlineAt + 5001)
					]);
				} else {
					const submission = crypto.randomUUID();
					await Promise.all([
						service.submit(game.id, r.id, submission, guess, r.startedAt + 1),
						service.submit(game.id, r.id, submission, guess, r.startedAt + 1)
					]);
				}
				if (number < 5) expect(send).not.toHaveBeenCalled();
			}
			expect((await service.read(game.id, Date.now())).saved).toBe(true);
			expect(send).toHaveBeenCalledTimes(1);
			expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'leader@example.fr' }));
		}
	);
	it('serializes competing new leaders and preserves both changes of leader', async () => {
		await rankedUser('leader', 10000, 100);
		await user('a');
		await user('b');
		const a = await claimable(11000, 100, 'a');
		const b = await claimable(12000, 100, 'b');
		await Promise.all([
			a.service.claim(a.game.id, Date.now()),
			b.service.claim(b.game.id, Date.now())
		]);
		const messages = send.mock.calls.map(([message]) => message);
		const previous = messages.filter((m) => m.to === 'leader@example.fr');
		expect(previous).toHaveLength(1);
		// If a publishes first, b dethrones a, rather than notifying the old leader twice.
		if (previous[0].text.startsWith('a ')) {
			expect(messages).toHaveLength(2);
			expect(messages).toContainEqual(
				expect.objectContaining({ to: 'a@example.fr', text: expect.stringMatching(/^b /) })
			);
		} else expect(messages).toHaveLength(1);
	});
	it('never retries failed emails and still saves the game', async () => {
		await rankedUser('leader', 10000, 100);
		await user('challenger');
		const { game, service } = await claimable(11000, 100);
		send.mockRejectedValue(new Error('provider failure'));
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			await expect(service.claim(game.id, Date.now())).resolves.toMatchObject({ saved: true });
			await service.claim(game.id, Date.now());
			await service.read(game.id, Date.now());
			await service.read(game.id, Date.now() + 86400000);
			expect(send).toHaveBeenCalledTimes(1);
			expect(log).toHaveBeenCalledExactlyOnceWith('guesser_leaderboard_email_failed');
		} finally {
			log.mockRestore();
		}
	});
	it('continues notifying other co-leaders when one delivery fails', async () => {
		await rankedUser('a', 10000, 100);
		await rankedUser('b', 10000, 100);
		await user('challenger');
		const { game, service } = await claimable(11000, 100);
		send.mockRejectedValueOnce(new Error('provider failure'));
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			expect((await service.claim(game.id, Date.now())).saved).toBe(true);
			expect(send.mock.calls.map(([message]) => message.to).sort()).toEqual([
				'a@example.fr',
				'b@example.fr'
			]);
		} finally {
			log.mockRestore();
		}
	});
	it('prints notification emails only in explicit local mode and escapes HTML', async () => {
		await rankedUser('leader', 10000, 100);
		await user('challenger');
		mailEnv.EMAIL_MODE = 'console';
		local = true;
		const { game, service } = await claimable(11000, 100);
		const log = vi.spyOn(console, 'info').mockImplementation(() => {});
		try {
			await service.claim(game.id, Date.now());
			expect(send).not.toHaveBeenCalled();
			expect(log).toHaveBeenCalledWith(expect.stringContaining('leader@example.fr'));
			expect(log).toHaveBeenCalledWith(expect.stringContaining('https://mapant.fr/guesser'));
		} finally {
			log.mockRestore();
		}
		expect(leaderboardEmail('<A & B>').html).toContain('&lt;A &amp; B&gt;');
	});
});
describe('local D1 authentication', () => {
	it('asks new addresses for a pseudonym before sending a code or creating an account', async () => {
		const jar = cookieJar();
		const auth = new AuthService(env, jar.cookies, true, 'ip');
		const now = Date.now();
		const log = vi.spyOn(console, 'info').mockImplementation(() => {});
		try {
			expect(await auth.send({ email: ' New@Example.fr ' }, now)).toEqual({ needsPseudonym: true });
			expect(log).not.toHaveBeenCalled();
			expect(jar.values.size).toBe(0);
			expect(await db.all(sql`select * from auth_challenges`)).toHaveLength(0);
			expect(await db.all(sql`select * from users`)).toHaveLength(0);
			await expect(auth.send({ email: 'new@example.fr', pseudonym: 'x' }, now)).rejects.toThrow();
			expect(log).not.toHaveBeenCalled();
		} finally {
			log.mockRestore();
		}
		const code = await challenge(auth, { email: 'new@example.fr', pseudonym: 'New player' }, now);
		expect(await db.all(sql`select * from users`)).toHaveLength(0);
		expect(await auth.verify({ code }, now + 1)).toEqual({ authenticated: true });
		expect(await resolveUser(env, jar.cookies, true, now + 2)).toMatchObject({
			pseudonym: 'New player'
		});
	});
	it('sends an existing address a code with email alone and preserves its pseudonym', async () => {
		await user('existing', 'Original');
		const jar = cookieJar();
		const auth = new AuthService(env, jar.cookies, true, 'ip');
		const now = Date.now();
		const code = await challenge(auth, { email: ' EXISTING@EXAMPLE.FR ' }, now);
		expect(await auth.verify({ code }, now + 1)).toEqual({ authenticated: true });
		expect(await resolveUser(env, jar.cookies, true, now + 2)).toMatchObject({
			pseudonym: 'Original'
		});
		expect(await db.all(sql`select * from users`)).toHaveLength(1);
	});
	it('limits email lookups before any code is sent', async () => {
		const auth = new AuthService(env, cookieJar().cookies, true, 'ip');
		const now = Date.now();
		for (let i = 0; i < 60; i++) {
			expect(await auth.send({ email: `new${i}@example.fr` }, now)).toEqual({
				needsPseudonym: true
			});
		}
		await expect(auth.send({ email: 'another@example.fr' }, now)).rejects.toMatchObject({
			status: 429
		});
	});
	it('prints code locally, verifies, consumes once, preserves existing pseudonym, logs out, and enforces fixed expiry', async () => {
		const jar = cookieJar();
		const auth = new AuthService(env, jar.cookies, true, 'ip');
		const now = Date.now();
		const code = await challenge(auth, { email: ' U@EXAMPLE.FR ', pseudonym: 'Équipe' }, now);
		const results = await Promise.allSettled([
			auth.verify({ code }, now + 1),
			auth.verify({ code }, now + 1)
		]);
		expect(
			results.filter((r) => r.status === 'fulfilled' && 'authenticated' in r.value)
		).toHaveLength(1);
		expect(await resolveUser(env, jar.cookies, true, now + 2)).toMatchObject({
			pseudonym: 'Équipe'
		});
		expect(await resolveUser(env, jar.cookies, true, now + 1 + SESSION_MS)).toBeNull();
		await expect(auth.verify({ code }, now + 3)).rejects.toThrow();
		await auth.logout();
		expect(await resolveUser(env, jar.cookies, true, now + 4)).toBeNull();
		const next = await challenge(
			auth,
			{ email: 'u@example.fr', pseudonym: 'Replacement' },
			now + 61000
		);
		await auth.verify({ code: next }, now + 61001);
		expect(await resolveUser(env, jar.cookies, true, now + 61002)).toMatchObject({
			pseudonym: 'Équipe'
		});
	});
	it('allows immediate login after logout while keeping five-minute email limits', async () => {
		await user();
		const jar = cookieJar();
		const auth = new AuthService({ ...env, EMAIL_ADDRESS_LIMIT: '2' }, jar.cookies, true, 'ip');
		const now = Date.now();
		for (let i = 0; i < 2; i++) {
			const code = await challenge(auth, { email: 'u@example.fr' }, now + i * 1000);
			expect(await auth.verify({ code }, now + i * 1000 + 1)).toEqual({ authenticated: true });
			expect(await resolveUser(env, jar.cookies, true, now + i * 1000 + 2)).toMatchObject({
				id: 'u'
			});
			await auth.logout();
			expect(await resolveUser(env, jar.cookies, true, now + i * 1000 + 3)).toBeNull();
			expect(await db.all(sql`select * from sessions`)).toHaveLength(0);
			expect(await db.all(sql`select * from auth_challenges`)).toHaveLength(0);
			expect(jar.values.has('mapant-challenge')).toBe(false);
			await expect(auth.verify({ code }, now + i * 1000 + 4)).rejects.toThrow();
		}
		await expect(auth.send({ email: 'u@example.fr' }, now + 2000)).rejects.toMatchObject({
			status: 429
		});
		const next = await challenge(auth, { email: 'u@example.fr' }, now + RATE_LIMIT_MS);
		expect(await auth.verify({ code: next }, now + RATE_LIMIT_MS + 1)).toEqual({
			authenticated: true
		});
	});
	it('does not charge cooldown rejections or concurrent resends to email allowances', async () => {
		await user();
		const auth = new AuthService(
			{ ...env, EMAIL_ADDRESS_LIMIT: '3', EMAIL_IP_LIMIT: '3' },
			cookieJar().cookies,
			true,
			'ip'
		);
		const now = Date.now();
		const log = vi.spyOn(console, 'info').mockImplementation(() => {});
		try {
			await auth.send({ email: 'u@example.fr' }, now);
			for (let i = 1; i <= 6; i++) {
				await expect(auth.send({ email: 'u@example.fr' }, now + i)).rejects.toThrow('60 secondes');
			}
			const results = await Promise.allSettled([
				auth.send({ email: 'u@example.fr' }, now + 60000),
				auth.send({ email: 'u@example.fr' }, now + 60000)
			]);
			expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
			await auth.send({ email: 'u@example.fr' }, now + 120000);
			expect(log).toHaveBeenCalledTimes(3);
			await expect(auth.send({ email: 'u@example.fr' }, now + 180000)).rejects.toMatchObject({
				status: 429
			});
		} finally {
			log.mockRestore();
		}
	});
	it('refunds the address allowance when the IP allowance rejects a send', async () => {
		await user();
		await user('other');
		const limitedEnv = { ...env, EMAIL_ADDRESS_LIMIT: '1', EMAIL_IP_LIMIT: '1' };
		const now = Date.now();
		await challenge(
			new AuthService(limitedEnv, cookieJar().cookies, true, 'ip'),
			{ email: 'other@example.fr' },
			now
		);
		await expect(
			new AuthService(limitedEnv, cookieJar().cookies, true, 'ip').send(
				{ email: 'u@example.fr' },
				now + 1
			)
		).rejects.toMatchObject({ status: 429 });
		const jar = cookieJar();
		const auth = new AuthService(limitedEnv, jar.cookies, true, 'another-ip');
		const code = await challenge(auth, { email: 'u@example.fr' }, now + 2);
		expect(await auth.verify({ code }, now + 3)).toEqual({ authenticated: true });
	});
	it('refunds failed deliveries and permits an immediate retry', async () => {
		await user();
		const jar = cookieJar();
		const send = vi.fn().mockRejectedValueOnce(new Error('delivery')).mockResolvedValue(undefined);
		const auth = new AuthService(
			{
				...env,
				EMAIL_ADDRESS_LIMIT: '1',
				EMAIL_IP_LIMIT: '1',
				EMAIL_MODE: 'cloudflare',
				EMAIL_FROM: 'sender@example.fr',
				EMAIL: { send }
			},
			jar.cookies,
			false,
			'ip'
		);
		const now = Date.now();
		await expect(auth.send({ email: 'u@example.fr' }, now)).rejects.toMatchObject({ status: 503 });
		expect(await db.all(sql`select * from auth_challenges`)).toHaveLength(0);
		await expect(auth.send({ email: 'u@example.fr' }, now + 1)).resolves.toHaveProperty('message');
		expect(send).toHaveBeenCalledTimes(2);
	});
	it('supports verified pseudonym conflicts and concurrent uniqueness races without repeating email', async () => {
		const a = cookieJar(),
			b = cookieJar();
		const aa = new AuthService(env, a.cookies, true, 'a'),
			bb = new AuthService(env, b.cookies, true, 'b');
		const now = Date.now();
		const ca = await challenge(aa, { email: 'a@example.fr', pseudonym: 'Same' }, now);
		const cb = await challenge(bb, { email: 'b@example.fr', pseudonym: 'SAME' }, now);
		const results = await Promise.all([
			aa.verify({ code: ca }, now + 1),
			bb.verify({ code: cb }, now + 1)
		]);
		expect(results.filter((r) => r.authenticated)).toHaveLength(1);
		const retry = results[0].needsPseudonym ? aa : bb;
		expect(await retry.verify({ pseudonym: 'Different' }, now + 2)).toMatchObject({
			authenticated: true
		});
		expect(await db.all(sql`select * from users`)).toHaveLength(2);
	});
	it('bounds attempts, invalidates resend codes, binds browser, and enforces expiry', async () => {
		const jar = cookieJar();
		const auth = new AuthService(env, jar.cookies, true, 'ip');
		const now = Date.now();
		const first = await challenge(auth, { email: 'a@example.fr', pseudonym: 'Player' }, now);
		const other = new AuthService(env, cookieJar().cookies, true, 'other');
		await expect(other.verify({ code: first }, now + 1)).rejects.toThrow();
		await expect(
			challenge(auth, { email: 'a@example.fr', pseudonym: 'Player' }, now + 1000)
		).rejects.toMatchObject({ status: 429 });
		const second = await challenge(
			auth,
			{ email: 'a@example.fr', pseudonym: 'Player' },
			now + 60000
		);
		if (first !== second) await expect(auth.verify({ code: first }, now + 60001)).rejects.toThrow();
		for (let i = 0; i < 5; i++)
			await expect(auth.verify({ code: 'invalid' }, now + 60002)).rejects.toThrow();
		await expect(auth.verify({ code: second }, now + 60003)).rejects.toThrow();
		const third = await challenge(
			auth,
			{ email: 'a@example.fr', pseudonym: 'Player' },
			now + 120000
		);
		await expect(auth.verify({ code: third }, now + 720000)).rejects.toThrow();
	});
	it('never uses console delivery in production or email services locally; rejects delivery errors', async () => {
		const send = vi.fn().mockRejectedValue(new Error('delivery'));
		const log = vi.spyOn(console, 'info').mockImplementation(() => {});
		try {
			await sendCode({ ...env, EMAIL: { send } }, true, 'a@example.fr', '123456');
			expect(send).not.toHaveBeenCalled();
			log.mockClear();
			await expect(
				sendCode({ ...env, EMAIL: { send } }, false, 'a@example.fr', '123456')
			).rejects.toMatchObject({ status: 503 });
			expect(log).not.toHaveBeenCalled();
			await expect(
				sendCode(
					{ ...env, EMAIL_MODE: 'cloudflare', EMAIL_FROM: 'sender@example.fr', EMAIL: { send } },
					false,
					'a@example.fr',
					'123456'
				)
			).rejects.toMatchObject({ status: 503 });
		} finally {
			log.mockRestore();
		}
	});
	it('limits atomic counters and keeps neither raw addresses nor IPs in keys', async () => {
		const now = Date.now();
		const results = await Promise.allSettled(
			Array.from({ length: 6 }, () => rateLimit(env, 'address', 'private@example.fr', 5, now))
		);
		expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(5);
		const rows = await db.all<{ key: string }>(sql`select key from rate_limits`);
		expect(rows[0].key).toMatch(/^[a-f0-9]{64}$/);
		await expect(
			rateLimit(env, 'address', 'private@example.fr', 5, now + RATE_LIMIT_MS - 1)
		).rejects.toMatchObject({ status: 429 });
		await rateLimit(env, 'address', 'private@example.fr', 5, now + RATE_LIMIT_MS);
	});
	it('does not refund a newer window', async () => {
		const now = Date.now();
		const reservation = await rateLimit(env, 'address', 'private@example.fr', 1, now);
		await rateLimit(env, 'address', 'private@example.fr', 1, now + RATE_LIMIT_MS);
		await releaseRateLimit(env, reservation);
		await expect(
			rateLimit(env, 'address', 'private@example.fr', 1, now + RATE_LIMIT_MS + 1)
		).rejects.toMatchObject({ status: 429 });
	});
});

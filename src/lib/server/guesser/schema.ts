import { sql } from 'drizzle-orm';
import {
	sqliteTable,
	text,
	integer,
	real,
	index,
	uniqueIndex,
	check
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text().primaryKey(),
	pseudonym: text().notNull(),
	pseudonymKey: text('pseudonym_key').notNull().unique(),
	email: text().notNull().unique(),
	verifiedAt: integer('verified_at').notNull(),
	createdAt: integer('created_at').notNull()
});
export const sessions = sqliteTable(
	'sessions',
	{
		tokenHash: text('token_hash').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		createdAt: integer('created_at').notNull(),
		expiresAt: integer('expires_at').notNull()
	},
	(t) => [index('sessions_expiry').on(t.expiresAt)]
);
export const challenges = sqliteTable(
	'auth_challenges',
	{
		id: text().primaryKey(),
		browserHash: text('browser_hash').notNull().unique(),
		intent: text().notNull(),
		email: text().notNull(),
		pseudonym: text(),
		pseudonymKey: text('pseudonym_key'),
		codeDigest: text('code_digest').notNull(),
		createdAt: integer('created_at').notNull(),
		expiresAt: integer('expires_at').notNull(),
		attempts: integer().notNull().default(0),
		verifiedAt: integer('verified_at'),
		consumedAt: integer('consumed_at')
	},
	(t) => [
		index('challenges_expiry').on(t.expiresAt),
		check('challenge_attempts', sql`${t.attempts} between 0 and 5`),
		check('challenge_intent', sql`${t.intent} in ('signup','login')`)
	]
);
export const guests = sqliteTable(
	'guest_sessions',
	{
		tokenHash: text('token_hash').primaryKey(),
		createdAt: integer('created_at').notNull(),
		expiresAt: integer('expires_at').notNull()
	},
	(t) => [index('guests_expiry').on(t.expiresAt)]
);
export const games = sqliteTable(
	'games',
	{
		id: text().primaryKey(),
		guestHash: text('guest_hash'),
		userId: text('user_id').references(() => users.id),
		status: text().notNull().default('playing'),
		scoringVersion: integer('scoring_version').notNull().default(1),
		totalPoints: integer('total_points').notNull().default(0),
		totalTime: integer('total_time').notNull().default(0),
		createdAt: integer('created_at').notNull(),
		completedAt: integer('completed_at'),
		claimUntil: integer('claim_until'),
		claimedAt: integer('claimed_at')
	},
	(t) => [
		index('games_guest').on(t.guestHash),
		index('games_user').on(t.userId),
		index('games_best_rank')
			.on(t.userId, sql`${t.totalPoints} desc`, t.totalTime, t.completedAt, t.id)
			.where(sql`${t.status} = 'completed' and ${t.userId} is not null`),
		check('game_owner', sql`${t.guestHash} is not null or ${t.userId} is not null`),
		check('game_status', sql`${t.status} in ('playing','completed')`),
		check('game_points', sql`${t.totalPoints} between 0 and 25000`),
		check('game_time', sql`${t.totalTime} between 0 and 1500000`)
	]
);
// guest_hash deliberately has no FK: expiring credentials must not delete game provenance.
export const rounds = sqliteTable(
	'game_rounds',
	{
		id: text().primaryKey(),
		gameId: text('game_id')
			.notNull()
			.references(() => games.id),
		number: integer().notNull(),
		targetX: real('target_x').notNull(),
		targetY: real('target_y').notNull(),
		startedAt: integer('started_at').notNull(),
		deadlineAt: integer('deadline_at').notNull(),
		guessLon: real('guess_lon'),
		guessLat: real('guess_lat'),
		receivedAt: integer('received_at'),
		distance: real(),
		points: integer(),
		elapsedMs: integer('elapsed_ms'),
		submissionId: text('submission_id')
	},
	(t) => [
		uniqueIndex('round_order').on(t.gameId, t.number),
		check('round_number', sql`${t.number} between 1 and 5`),
		check('round_points', sql`${t.points} between 0 and 5000`),
		check('round_time', sql`${t.elapsedMs} between 0 and 300000`),
		check('round_longitude', sql`${t.guessLon} between -180 and 180`),
		check('round_latitude', sql`${t.guessLat} between -90 and 90`),
		check('round_deadline', sql`${t.deadlineAt} = ${t.startedAt} + 300000`),
		check(
			'round_result',
			sql`(${t.receivedAt} is null and ${t.points} is null and ${t.elapsedMs} is null and ${t.submissionId} is null) or (${t.receivedAt} is not null and ${t.points} is not null and ${t.elapsedMs} is not null and ${t.submissionId} is not null)`
		),
		check('round_guess', sql`(${t.guessLon} is null) = (${t.guessLat} is null)`)
	]
);
export const rateLimits = sqliteTable(
	'rate_limits',
	{
		key: text().primaryKey(),
		count: integer().notNull(),
		expiresAt: integer('expires_at').notNull()
	},
	(t) => [index('limits_expiry').on(t.expiresAt)]
);

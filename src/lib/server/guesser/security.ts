import { sql } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { database, GuesserError, type GuesserEnv } from './db.js';
import { SESSION_MS, type SafeUser } from '../../guesser/protocol.js';
export const token = () =>
	Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
		b.toString(16).padStart(2, '0')
	).join('');
const hex = (buffer: ArrayBuffer) =>
	Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
export const hash = async (value: string) =>
	hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
export async function digest(secret: string, value: string) {
	if (!secret || secret.length < 32)
		throw new GuesserError(503, 'Le service de connexion est mal configuré.');
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}
export const cookieName = (name: string, local: boolean) =>
	`${local ? 'mapant-' : '__Host-mapant-'}${name}`;
export function setCookie(
	cookies: Cookies,
	name: string,
	value: string,
	local: boolean,
	maxAge = SESSION_MS / 1000
) {
	cookies.set(cookieName(name, local), value, {
		path: '/',
		secure: !local,
		httpOnly: true,
		sameSite: 'lax',
		maxAge
	});
}
export async function resolveUser(
	env: GuesserEnv,
	cookies: Cookies,
	local: boolean,
	now: number
): Promise<SafeUser | null> {
	const value = cookies.get(cookieName('session', local));
	if (!value) return null;
	return (
		(await database(env).get<SafeUser>(
			sql`select u.id, u.pseudonym from sessions s join users u on u.id=s.user_id where s.token_hash=${await hash(value)} and s.expires_at>${now}`
		)) ?? null
	);
}
export async function guest(
	env: GuesserEnv,
	cookies: Cookies,
	local: boolean,
	now: number,
	create = false
) {
	let value = cookies.get(cookieName('guest', local));
	const db = database(env);
	if (value) {
		const key = await hash(value);
		const row = await db.get(
			sql`update guest_sessions set expires_at=${now + SESSION_MS} where token_hash=${key} and expires_at>${now} returning token_hash`
		);
		if (row) {
			setCookie(cookies, 'guest', value, local);
			return key;
		}
	}
	if (!create) return null;
	value = token();
	const key = await hash(value);
	await db.run(sql`insert into guest_sessions values (${key},${now},${now + SESSION_MS})`);
	setCookie(cookies, 'guest', value, local);
	return key;
}
export const RATE_LIMIT_MS = 5 * 60 * 1000;
interface RateLimitReservation {
	key: string;
	expiresAt: number;
}
export async function rateLimit(
	env: GuesserEnv,
	scope: string,
	identity: string,
	max: number,
	now: number,
	window = RATE_LIMIT_MS
) {
	const key = await digest(env.AUTH_SECRET, `limit:${scope}:${identity}`);
	const row = await database(env).get<{ expires_at: number }>(
		sql`insert into rate_limits (key,count,expires_at) values (${key},1,${now + window}) on conflict(key) do update set count=case when expires_at<=${now} then 1 else count+1 end, expires_at=case when expires_at<=${now} then ${now + window} else expires_at end where expires_at<=${now} or count<${max} returning expires_at`
	);
	if (!row) throw new GuesserError(429, 'Trop de tentatives. Patientez avant de réessayer.');
	return { key, expiresAt: row.expires_at };
}
export async function releaseRateLimit(env: GuesserEnv, reservation: RateLimitReservation) {
	// A delayed failure must not refund a request from a newer window.
	await database(env).run(
		sql`update rate_limits set count=max(0,count-1) where key=${reservation.key} and expires_at=${reservation.expiresAt}`
	);
}
export async function cleanup(env: Pick<GuesserEnv, 'DB'>, now = Date.now()) {
	const db = database(env);
	await db.batch([
		db.run(sql`delete from sessions where expires_at<=${now}`),
		db.run(sql`delete from auth_challenges where expires_at<=${now}`),
		db.run(sql`delete from guest_sessions where expires_at<=${now}`),
		db.run(sql`delete from rate_limits where expires_at<=${now}`)
	]);
}

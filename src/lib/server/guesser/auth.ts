import { sql } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { database, conflict, GuesserError, type GuesserEnv } from './db.js';
import { canonicalEmail, canonicalPseudonym, CODE_MS, SESSION_MS } from '../../guesser/protocol.js';
import {
	cookieName,
	digest,
	hash,
	rateLimit,
	releaseRateLimit,
	setCookie,
	token
} from './security.js';
import { sendCode } from './email.js';
interface Challenge {
	id: string;
	email: string;
	pseudonym: string | null;
	pseudonym_key: string | null;
	verified_at: number | null;
	consumed_at: number | null;
	expires_at: number;
}
export class AuthService {
	private db;
	constructor(
		private env: GuesserEnv,
		private cookies: Cookies,
		private local: boolean,
		private ip: string
	) {
		this.db = database(env);
	}
	async send(input: Record<string, unknown>, now: number) {
		const email = canonicalEmail(input.email);
		await rateLimit(this.env, 'auth-start-ip', this.ip, 60, now);
		const existing = await this.db.get(sql`select id from users where email=${email}`);
		if (!existing && !input.pseudonym) return { needsPseudonym: true };
		const name = existing ? null : canonicalPseudonym(input.pseudonym);
		const intent = existing ? 'login' : 'signup';
		let browser = this.cookies.get(cookieName('challenge', this.local));
		if (!browser) {
			browser = token();
			setCookie(this.cookies, 'challenge', browser, this.local, 600);
		}
		const browserHash = await hash(browser);
		const cooldown = () => new GuesserError(429, 'Attendez 60 secondes avant de renvoyer un code.');
		if (
			await this.db.get(
				sql`select id from auth_challenges where browser_hash=${browserHash} and created_at>${now - 60000}`
			)
		)
			throw cooldown();
		const id = crypto.randomUUID();
		// Rejection sampling avoids modulo bias in the six-digit code.
		let random: number;
		do {
			random = crypto.getRandomValues(new Uint32Array(1))[0];
		} while (random >= 4294000000);
		const code = String(random % 1000000).padStart(6, '0');
		const codeDigest = await digest(this.env.AUTH_SECRET, `${id}:${code}`);
		const reservations: Awaited<ReturnType<typeof rateLimit>>[] = [];
		let created = false;
		try {
			reservations.push(
				await rateLimit(
					this.env,
					'send-address',
					email,
					Number(this.env.EMAIL_ADDRESS_LIMIT) || 5,
					now
				)
			);
			reservations.push(
				await rateLimit(this.env, 'send-ip', this.ip, Number(this.env.EMAIL_IP_LIMIT) || 20, now)
			);
			const row = await this.db
				.get(sql`insert into auth_challenges (id,browser_hash,intent,email,pseudonym,pseudonym_key,code_digest,created_at,expires_at)
   values (${id},${browserHash},${intent},${email},${name?.display ?? null},${name?.key ?? null},${codeDigest},${now},${now + CODE_MS})
   on conflict(browser_hash) do update set id=excluded.id,intent=excluded.intent,email=excluded.email,pseudonym=excluded.pseudonym,pseudonym_key=excluded.pseudonym_key,code_digest=excluded.code_digest,created_at=excluded.created_at,expires_at=excluded.expires_at,attempts=0,verified_at=null,consumed_at=null
   where auth_challenges.created_at<=${now - 60000} returning id`);
			if (!row) throw cooldown();
			created = true;
			setCookie(this.cookies, 'challenge', browser, this.local, 600);
			await sendCode(this.env, this.local, email, code);
		} catch (cause) {
			// Only accepted deliveries consume the email budgets, including concurrent resends.
			await Promise.all(reservations.map((reservation) => releaseRateLimit(this.env, reservation)));
			if (created) await this.db.run(sql`delete from auth_challenges where id=${id}`);
			throw cause;
		}
		return {
			message: 'Un code a été envoyé. Vérifiez aussi les courriers indésirables.'
		};
	}
	async verify(input: Record<string, unknown>, now: number) {
		await rateLimit(this.env, 'verify-ip', this.ip, 60, now);
		const browser = this.cookies.get(cookieName('challenge', this.local));
		if (!browser) throw new GuesserError(400, 'Demandez un nouveau code.');
		const browserHash = await hash(browser);
		let c = await this.db.get<Challenge>(
			sql`select * from auth_challenges where browser_hash=${browserHash} and consumed_at is null and expires_at>${now}`
		);
		if (!c) throw new GuesserError(400, 'Code expiré ou déjà utilisé.');
		if (!c.verified_at) {
			const codeDigest = await digest(
				this.env.AUTH_SECRET,
				`${c.id}:${typeof input.code === 'string' ? input.code : ''}`
			);
			c = await this.db.get<Challenge>(
				sql`update auth_challenges set attempts=attempts+1,verified_at=case when code_digest=${codeDigest} then ${now} else null end where id=${c.id} and consumed_at is null and verified_at is null and attempts<5 and expires_at>${now} returning *`
			);
			if (!c?.verified_at)
				throw new GuesserError(
					400,
					'Code invalide ou trop de tentatives. Demandez un nouveau code si nécessaire.'
				);
		}
		if (input.pseudonym) {
			const name = canonicalPseudonym(input.pseudonym);
			c.pseudonym = name.display;
			c.pseudonym_key = name.key;
		}
		const existing = await this.db.get<{ id: string }>(
			sql`select id from users where email=${c.email}`
		);
		if (!existing && !c.pseudonym) return { needsPseudonym: true };
		if (
			!existing &&
			(await this.db.get(sql`select id from users where pseudonym_key=${c.pseudonym_key}`))
		)
			return {
				needsPseudonym: true,
				message: 'Ce pseudo est déjà utilisé. Choisissez-en un autre, votre adresse est vérifiée.'
			};
		await rateLimit(this.env, 'account-ip', this.ip, 20, now);
		const session = token(),
			sessionHash = await hash(session),
			userId = crypto.randomUUID();
		const results = await this.db.batch([
			this.db.run(sql`insert into users (id,pseudonym,pseudonym_key,email,verified_at,created_at)
    select ${userId},${c.pseudonym},${c.pseudonym_key},${c.email},${now},${now}
    where exists(select 1 from auth_challenges where id=${c.id} and verified_at is not null and consumed_at is null and expires_at>${now})
    and not exists(select 1 from users where email=${c.email}) on conflict do nothing`),
			this.db.run(sql`insert into sessions (token_hash,user_id,created_at,expires_at)
    select ${sessionHash},u.id,${now},${now + SESSION_MS} from users u join auth_challenges c on c.email=u.email
    where c.id=${c.id} and c.verified_at is not null and c.consumed_at is null and c.expires_at>${now}`),
			this.db.run(
				sql`update auth_challenges set consumed_at=${now} where id=${c.id} and consumed_at is null and exists(select 1 from sessions where token_hash=${sessionHash})`
			)
		]);
		if (!results[1].meta.changes) {
			const current = await this.db.get<Challenge>(
				sql`select * from auth_challenges where id=${c.id}`
			);
			if (current && !current.consumed_at && current.expires_at > now)
				return {
					needsPseudonym: true,
					message: 'Ce pseudo vient d’être choisi. Essayez un autre pseudo.'
				};
			throw conflict();
		}
		setCookie(this.cookies, 'session', session, this.local);
		return { authenticated: true };
	}
	async logout() {
		const session = this.cookies.get(cookieName('session', this.local));
		if (session)
			await this.db.run(sql`delete from sessions where token_hash=${await hash(session)}`);
		this.cookies.delete(cookieName('session', this.local), { path: '/', secure: !this.local });
		const browser = this.cookies.get(cookieName('challenge', this.local));
		if (browser)
			await this.db.run(sql`delete from auth_challenges where browser_hash=${await hash(browser)}`);
		this.cookies.delete(cookieName('challenge', this.local), { path: '/', secure: !this.local });
		return { ok: true };
	}
}

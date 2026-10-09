import { json } from '@sveltejs/kit';
import { dev } from '$app/env';
import { env } from 'cloudflare:workers';
import { AuthService } from '#lib/server/guesser/auth.js';
import { GameService } from '#lib/server/guesser/games.js';
import { GuesserError } from '#lib/server/guesser/db.js';
import { guest, rateLimit } from '#lib/server/guesser/security.js';
import type { RequestHandler } from './$types';
const handler: RequestHandler = async (event) => {
	const { request, params, cookies, locals, url } = event;
	const now = locals.receivedAt;
	const headers = { 'Cache-Control': 'no-store' };
	try {
		const action = params.action;
		const ip = dev ? 'local' : request.headers.get('cf-connecting-ip') || 'unknown';
		const auth = new AuthService(env, cookies, dev, ip);
		const input =
			request.method === 'POST' ? ((await request.json()) as Record<string, unknown>) : {};
		if (!input || typeof input !== 'object' || Array.isArray(input))
			throw new GuesserError(400, 'Requête invalide.');
		let result: unknown;
		if (request.method === 'POST' && action === 'auth/send') result = await auth.send(input, now);
		else if (request.method === 'POST' && action === 'auth/verify')
			result = await auth.verify(input, now);
		else if (request.method === 'POST' && action === 'auth/logout') result = await auth.logout();
		else {
			if (request.method === 'POST' && action === 'games')
				await rateLimit(env, 'game-ip', ip, 60, now);
			const guestHash = await guest(
				env,
				cookies,
				dev,
				now,
				request.method === 'POST' && action === 'games' && !locals.user
			);
			const games = new GameService(
				{ ...env, LOCAL_TILE_URL: dev ? env.LOCAL_TILE_URL : undefined },
				{ guestHash, userId: locals.user?.id ?? null },
				undefined,
				dev
			);
			if (request.method === 'POST' && action === 'games') result = await games.create(now);
			else {
				const id = request.method === 'GET' ? url.searchParams.get('id') : input.gameId;
				if (typeof id !== 'string' || id.length > 100)
					throw new GuesserError(400, 'Partie invalide.');
				if (request.method === 'GET' && action === 'games') result = await games.read(id, now);
				else if (request.method === 'POST' && action === 'round/start')
					result = await games.next(id, Number(input.number), now);
				else if (request.method === 'POST' && action === 'round/submit')
					result = await games.submit(
						id,
						String(input.roundId),
						String(input.submissionId),
						input.guess,
						now
					);
				else if (request.method === 'POST' && action === 'games/claim')
					result = await games.claim(id, now);
				else throw new GuesserError(404, 'Action inconnue.');
			}
		}
		return json(result, { headers });
	} catch (cause) {
		if (cause instanceof GuesserError) {
			if (cause.status >= 500)
				console.error('guesser_service_failed', { action: params.action, status: cause.status });
			return json({ message: cause.message }, { status: cause.status, headers });
		}
		if (
			cause instanceof SyntaxError ||
			(cause instanceof Error && /invalide|pseudo doit/.test(cause.message))
		)
			return json({ message: cause.message }, { status: 400, headers });
		// Never log request payloads, recipient addresses or challenge material.
		console.error('guesser_request_failed', { action: params.action });
		return json(
			{ message: 'Le service est indisponible. Votre partie est conservée ; réessayez.' },
			{ status: 503, headers }
		);
	}
};
export const GET = handler;
export const POST = handler;

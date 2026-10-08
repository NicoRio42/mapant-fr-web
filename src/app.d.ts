declare namespace App {
	interface Locals {
		user: import('./lib/guesser/protocol.js').SafeUser | null;
		receivedAt: number;
	}
}
declare module 'cloudflare:workers' {
	export const env: import('./lib/server/guesser/db.js').GuesserEnv;
}

import type { R2Bucket } from '@cloudflare/workers-types';

declare global {
	namespace App {
		interface Locals {
			user: import('lucia').User | null;
			session: import('lucia').Session | null;
		}

		interface Platform {
			env?: {
				R2_BUCKET: R2Bucket;
				R2_BUCKET_TILES: R2Bucket;
			};
		}
	}
}

declare module '$env/static/public' {
	export const PUBLIC_CF_PAGES_BRANCH: string;
}

declare module '$env/static/private' {
	export const TURSO_DB_URL: string;
	export const TURSO_DB_TOKEN: string;
	export const DKIM_PRIVATE_KEY: string;
	export const STRIPE_API_KEY: string;
	export const STRIPE_WEBHOOK_SECRET: string;
	export const CRYPTO_SECRET_KEY: string;
}

export {};

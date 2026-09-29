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

export {};

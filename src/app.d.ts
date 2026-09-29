import type { R2Bucket } from '@cloudflare/workers-types';

declare global {
	namespace App {
		interface Platform {
			env?: {
				R2_BUCKET_TILES: R2Bucket;
			};
		}
	}
}

export {};

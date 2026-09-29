declare module 'cloudflare:workers' {
	import type { R2Bucket } from '@cloudflare/workers-types';

	export const env: {
		R2_BUCKET_MAPANT: R2Bucket;
	};
}

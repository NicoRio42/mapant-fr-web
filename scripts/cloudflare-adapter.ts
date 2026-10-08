import adapter from '@sveltejs/adapter-cloudflare';
import type { Adapter } from '@sveltejs/kit';
import { renameSync, writeFileSync } from 'node:fs';

// The upstream adapter writes directly to Wrangler's `main`; add scheduled
// handling only AFTER it finishes so a build cannot overwrite our handler.
export default function guesserAdapter(): Adapter {
	const base = adapter();
	return {
		...base,
		async adapt(builder) {
			await base.adapt(builder);
			renameSync(
				'.svelte-kit/cloudflare/_worker.js',
				'.svelte-kit/cloudflare-tmp/request-handler.js'
			);
			writeFileSync(
				'.svelte-kit/cloudflare/_worker.js',
				`import app from '../cloudflare-tmp/request-handler.js';
import { cleanup } from '../../src/lib/server/guesser/security.ts';
export default { ...app, async scheduled(event, env) { await cleanup(env); } };
`
			);
		}
	};
}

import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_CF_PAGES_BRANCH: { public: true, static: true },
	PUBLIC_MAPANT_ASSETS_BASE_URL: { public: true, static: true },
	PUBLIC_MAPANT_TILES_BASE_URL: { public: true, static: true }
});

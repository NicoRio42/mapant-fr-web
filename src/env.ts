import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_MAPANT_TILES_BASE_URL: { public: true, static: true }
});

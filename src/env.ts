import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	ADMIN_LOGIN: { static: true },
	PUBLIC_CF_PAGES_BRANCH: { public: true, static: true },
	CRYPTO_SECRET_KEY: { static: true },
	TURSO_DB_TOKEN: { static: true },
	TURSO_DB_URL: { static: true },
	DKIM_PRIVATE_KEY: { static: true },
	PUBLIC_MAPANT_ASSETS_BASE_URL: { public: true, static: true },
	PUBLIC_MAPANT_TILES_BASE_URL: { public: true, static: true }
});

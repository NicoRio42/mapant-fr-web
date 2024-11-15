import type { Config } from 'drizzle-kit';
import { env } from 'node:process';

export default {
	schema: './src/lib/server/schema.ts',
	out: './migrations',
	dialect: 'turso',
	dbCredentials: { url: env.TURSO_DB_URL ?? '', authToken: env.TURSO_DB_TOKEN }
} satisfies Config;

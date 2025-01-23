import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/schema.ts',
	out: './migrations',
	dialect: 'turso',
	dbCredentials: { url: 'file:main.db' }
});

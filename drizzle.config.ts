import { defineConfig } from 'drizzle-kit';
export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/server/guesser/schema.ts',
	out: './migrations'
});

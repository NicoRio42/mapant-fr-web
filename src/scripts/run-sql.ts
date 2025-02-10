import { tilesTable } from '$lib/server/schema';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from 'node:process';

const db = drizzle({ connection: { url: env.TURSO_DB_URL ?? '', authToken: env.TURSO_DB_TOKEN } });

await db.select().from(tilesTable).all();

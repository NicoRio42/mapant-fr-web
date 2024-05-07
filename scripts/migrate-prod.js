import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import { env } from 'node:process';

const db = drizzle(createClient({ url: env.TURSO_DB_URL ?? '', authToken: env.TURSO_DB_TOKEN }));

await migrate(db, { migrationsFolder: './migrations' });

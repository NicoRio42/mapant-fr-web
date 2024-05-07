import { dev } from '$app/environment';
import { TURSO_DB_TOKEN, TURSO_DB_URL } from '$env/static/private';
import * as schema from '$lib/server/schema.js';
import { createClient as createClientWeb } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';

const config =
	!dev || import.meta.env.MODE === 'production'
		? { url: TURSO_DB_URL, authToken: TURSO_DB_TOKEN }
		: { url: 'file:main.db' };

const libsqlClient = dev
	? (await import('@libsql/client')).createClient(config)
	: createClientWeb(config);

export const db = drizzle(libsqlClient, { schema });

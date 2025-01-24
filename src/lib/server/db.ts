import { dev } from '$app/environment';
import { TURSO_DB_TOKEN, TURSO_DB_URL } from '$env/static/private';
import * as schema from '$lib/server/schema.js';
import { drizzle } from '#drizzle-orm/libsql';

const connection =
	!dev || import.meta.env.MODE === 'production'
		? { url: TURSO_DB_URL, authToken: TURSO_DB_TOKEN }
		: { url: 'file:main.db' };

export const getDb = () => drizzle({ connection, schema });

import { dev } from '$app/environment';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia } from 'lucia';
import { db } from './db.js';
import { sessionTable, userTable, type User } from './schema.js';

const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);

export const auth = new Lucia(adapter, {
	sessionCookie: { attributes: { secure: !dev } },
	getUserAttributes: (attributes) => ({
		id: attributes.id,
		username: attributes.username,
		email: attributes.email
	})
});

declare module 'lucia' {
	interface Register {
		Lucia: Auth;
		DatabaseUserAttributes: User;
	}
}

type Auth = typeof auth;

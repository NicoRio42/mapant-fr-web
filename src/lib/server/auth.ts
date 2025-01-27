import { dev } from '$app/environment';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia } from 'lucia';
import { getDb } from './db.js';
import { sessionTable, userTable, type User } from './schema.js';

export const getAuth = () => {
	const db = getDb();
	const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);

	const auth = new Lucia(adapter, {
		sessionCookie: { attributes: { secure: !dev } },
		getUserAttributes: (attributes) => ({
			id: attributes.id,
			email: attributes.email
		})
	});

	return auth;
};

type Auth = ReturnType<typeof getAuth>;

declare module 'lucia' {
	interface Register {
		Lucia: Auth;
		DatabaseUserAttributes: User;
	}
}

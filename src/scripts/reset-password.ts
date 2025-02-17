import { userTable } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { argv, env } from 'node:process';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { Scrypt } from '../lib/server/scrypt';

const db = drizzle({ connection: { url: env.TURSO_DB_URL ?? '', authToken: env.TURSO_DB_TOKEN } });

const newRandomPassword = generateRandomString(20, alphabet('a-z', 'A-Z', '0-9'));
const hashedPassword = await new Scrypt().hash(newRandomPassword);

const email = argv[2];

const [user] = await db
	.update(userTable)
	.set({ hashedPassword })
	.where(eq(userTable.email, email))
	.returning();

if (user === undefined) console.log('No user with this email');
else console.log(newRandomPassword);

import {
	contributionTable,
	contributionWithoutCompensationTable,
	userTable
} from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { env } from 'node:process';

const db = drizzle({ connection: { url: env.TURSO_DB_URL ?? '', authToken: env.TURSO_DB_TOKEN } });

const users = await db
	.select()
	.from(userTable)
	.leftJoin(contributionTable, eq(contributionTable.fkUser, userTable.id))
	.leftJoin(
		contributionWithoutCompensationTable,
		eq(contributionWithoutCompensationTable.fkUser, userTable.id)
	)
	.all();

const emails = Array.from(
	new Set(
		users
			.filter(
				({ user, contribution, contribution_without_compensation }) =>
					contribution !== null ||
					contribution_without_compensation !== null ||
					user.allowedSendingEmail
			)
			.map((u) => u.user.email)
	)
).join(',');

console.log(emails);

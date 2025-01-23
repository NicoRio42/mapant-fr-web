import { db } from '$lib/server/db';
import { Scrypt } from '$lib/server/scrypt';
import { workersTable } from '$lib/server/schema.js';
import { generateRandomString, alphabet } from 'oslo/crypto';
import { eq } from 'drizzle-orm';

export async function POST({ params }) {
	const worker = await db
		.select()
		.from(workersTable)
		.where(eq(workersTable.id, params.workerId))
		.get();

	if (worker === undefined) return new Response(null, { status: 404 });

	const apiKey = generateRandomString(40, alphabet('a-z', '0-9'));
	const hashedApiKey = await new Scrypt().hash(apiKey);

	await db
		.update(workersTable)
		.set({ hashedApiKey })
		.where(eq(workersTable.id, params.workerId))
		.run();

	return new Response(apiKey, { status: 202 });
}

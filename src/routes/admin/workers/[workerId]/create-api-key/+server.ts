import { generateApiKey, hashApiKey } from '$lib/server/crypto';
import { getDb } from '$lib/server/db';
import { workersTable } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';

export async function POST({ params }) {
	const db = getDb();
	const worker = await db
		.select()
		.from(workersTable)
		.where(eq(workersTable.id, params.workerId))
		.get();

	if (worker === undefined) return new Response(null, { status: 404 });

	const apiKey = await generateApiKey();
	const hashedApiKey = await hashApiKey(apiKey);

	await db
		.update(workersTable)
		.set({ hashedApiKey })
		.where(eq(workersTable.id, params.workerId))
		.run();

	return new Response(apiKey, { status: 202 });
}

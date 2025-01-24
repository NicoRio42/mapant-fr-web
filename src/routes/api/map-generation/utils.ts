import { verifyApiKey } from '$lib/server/crypto';
import { getDb } from '$lib/server/db';
import { workersTable } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export async function getWorkerIdOrErrorStatus(
	headers: Headers
): Promise<[string, null] | [null, number]> {
	const authorizationHeader = headers.get('Authorization');
	if (authorizationHeader === null || !authorizationHeader.startsWith('Bearer')) {
		return [null, 401];
	}

	const token = authorizationHeader.split(' ')[1];
	if (!token) return [null, 401];
	const [workerId, apiKey] = token.split('.');
	if (!workerId || !apiKey) return [null, 401];

	const db = getDb();
	const worker = await db.select().from(workersTable).where(eq(workersTable.id, workerId)).get();
	if (worker === undefined || !worker.hashedApiKey) return [null, 403];

	const isApiKeyRight = await verifyApiKey(apiKey, worker.hashedApiKey);
	if (!isApiKeyRight) return [null, 403];

	return [workerId, null];
}

import { db } from '$lib/server/db';
import { workersTable } from '$lib/server/schema';
import { Scrypt } from '$lib/server/scrypt';
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

	const worker = await db.select().from(workersTable).where(eq(workersTable.id, workerId)).get();
	if (worker === undefined || !worker.hashedApiKey) return [null, 403];

	const isApiKeyRight = await new Scrypt().verify(worker.hashedApiKey, apiKey);
	if (!isApiKeyRight) return [null, 403];

	return [workerId, null];
}

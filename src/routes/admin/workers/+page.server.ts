import { db } from '$lib/server/db';
import { workersTable } from '$lib/server/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { workerFormSchema } from './worker-form-schema';

export async function load() {
	const workers = await db.select().from(workersTable).all();
	const form = await superValidate(zod(workerFormSchema));

	return { workers, form };
}

export const actions = {
	default: async () => {}
};

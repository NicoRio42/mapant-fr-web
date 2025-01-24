import { getDb } from '$lib/server/db';
import { workersTable } from '$lib/server/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { workerFormSchema } from './worker-form-schema';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export async function load() {
	const db = getDb();
	const workers = (await db.select().from(workersTable).all()).map((worker) => ({
		name: worker.name,
		id: worker.id,
		hasToken: worker.hashedApiKey !== null
	}));

	const form = await superValidate(zod(workerFormSchema));

	return { workers, form };
}

export const actions = {
	add: async ({ request }) => {
		const form = await superValidate(request, zod(workerFormSchema));
		if (!form.valid) throw error(400);
		const { name } = form.data;

		const db = getDb();
		await db.insert(workersTable).values({ name }).run();

		throw redirect(302, '/admin/workers');
	},
	delete: async ({ request }) => {
		const formadata = await request.formData();
		const workerId = formadata.get('worker-id');
		if (typeof workerId !== 'string') throw error(400);

		const db = getDb();
		await db.delete(workersTable).where(eq(workersTable.id, workerId)).run();
		throw redirect(302, '/admin/workers');
	}
};

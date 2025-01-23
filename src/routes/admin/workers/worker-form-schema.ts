import { z } from 'zod';

export const workerFormSchema = z.object({
	name: z.string().min(0).max(200)
});

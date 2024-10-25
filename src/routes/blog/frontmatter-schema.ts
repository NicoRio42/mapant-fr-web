import { z } from 'zod';

export const frontmatterSchema = z.object({
	title: z.string(),
	description: z.string(),
	banner: z.string(),
	date: z.string().date(),
	author: z.string(),
	// Drafts are published to staging environment, but not prod
	draft: z.boolean().optional().default(false)
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

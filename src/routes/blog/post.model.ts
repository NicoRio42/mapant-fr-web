import type { Frontmatter } from './frontmatter-schema';

export type Post = {
	slug: string;
	frontmatter: Frontmatter;
	content: string;
};

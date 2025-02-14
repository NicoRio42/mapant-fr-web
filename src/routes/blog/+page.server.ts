import { error } from '@sveltejs/kit';
import { frontmatterSchema } from './frontmatter-schema';
import type { Post } from './post.model';
import { dev } from '$app/environment';
import { PUBLIC_CF_PAGES_BRANCH } from '$env/static/public';
import { STAGING_BRANCH_NAME } from '$lib/constants';

export function load() {
	const postsRecord = import.meta.glob('./posts/*.md', { eager: true });

	const posts: Post[] = [];

	Object.keys(postsRecord).forEach((slug) => {
		const post = postsRecord[slug] as any;
		const content = post.default;
		if (typeof content !== 'string') throw error(500, 'Body is not string');
		const frontmatter = frontmatterSchema.parse(post.frontmatter);
		if (frontmatter.draft && !dev && PUBLIC_CF_PAGES_BRANCH !== STAGING_BRANCH_NAME) return;

		posts.push({ slug: slug.substring(8).replace('.md', ''), content, frontmatter });
	});

	posts.sort(
		(p1, p2) => new Date(p2.frontmatter.date).getTime() - new Date(p1.frontmatter.date).getTime()
	);

	return { posts };
}

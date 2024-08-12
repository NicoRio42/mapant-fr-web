import { error } from '@sveltejs/kit';
import type { Post } from '../post.model.js';
import { frontmatterSchema } from '../frontmatter-schema.js';
import { dev } from '$app/environment';
import { PUBLIC_CF_PAGES_BRANCH } from '$env/static/public';
import { STAGING_BRANCH_NAME } from '$lib/constants.js';

export async function load({ params }) {
	let post: Post;

	try {
		const rawPost = await import(`../posts/${params.slug}.md`);

		post = {
			slug: params.slug,
			frontmatter: frontmatterSchema.parse(rawPost.frontmatter),
			content: rawPost.default
		};
	} catch (e) {
		console.error(e);
		throw error(404, `Could not find ${params.slug}`);
	}

	if (post.frontmatter.draft && !dev && PUBLIC_CF_PAGES_BRANCH !== STAGING_BRANCH_NAME) {
		throw error(404);
	}

	return { post };
}

import { error } from '@sveltejs/kit';
import type { Post } from '../post.model.js';
import { frontmatterSchema } from '../frontmatter-schema.js';
import { dev } from '$app/env';

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

	if (post.frontmatter.draft && !dev) {
		throw error(404);
	}

	return { post };
}

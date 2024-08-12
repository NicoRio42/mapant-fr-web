import { error } from '@sveltejs/kit';
import type { Post } from '../post.model.js';
import { frontmatterSchema } from '../frontmatter-schema.js';

export async function load({ params }) {
	try {
		const rawPost = await import(`../posts/${params.slug}.md`);

		const post: Post = {
			slug: params.slug,
			frontmatter: frontmatterSchema.parse(rawPost.frontmatter),
			content: rawPost.default
		};

		return { post };
	} catch (e) {
		console.error(e);
		throw error(404, `Could not find ${params.slug}`);
	}
}

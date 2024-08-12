<script>
	import { page } from '$app/stores';
	import { WEBSITE_NAME } from '$lib/constants';
	import { MetaTags } from 'svelte-meta-tags';

	export let data;
</script>

<MetaTags
	title="{WEBSITE_NAME} | Blog"
	description="Article de blog du site mapant.fr"
	canonical={new URL($page.url.pathname, $page.url.origin).href}
	twitter={{ cardType: 'summary_large_image' }}
/>

<main container max-w-100 m-x-auto py-8 px-4>
	<h1>Blog</h1>

	<ul>
		{#each data.posts as post (post.slug)}
			<li>
				<a href="/blog/{post.slug}">{post.frontmatter.title}</a>
			</li>
		{/each}
	</ul>
</main>

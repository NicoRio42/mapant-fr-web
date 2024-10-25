<script>
	import { MetaTags } from 'svelte-meta-tags';
	import { WEBSITE_NAME } from '$lib/constants';
	import { page } from '$app/stores';

	let { data } = $props();
</script>

<MetaTags
	title="{WEBSITE_NAME} | Blog | {data.post.frontmatter.title}"
	description={data.post.frontmatter.description}
	canonical={new URL($page.url.pathname, $page.url.origin).href}
	openGraph={{
		url: new URL($page.url.pathname, $page.url.origin).href,
		locale: 'fr_FR',
		images: [{ url: data.post.frontmatter.banner }]
	}}
	twitter={{ cardType: 'summary_large_image' }}
/>

<main container max-w-200 m-x-auto py-8 px-4>
	<h1
		style:--view-transition-name="title-{data.post.slug}"
		class="[view-transition-name:var(--view-transition-name)]"
	>
		{data.post.frontmatter.title}
	</h1>

	<img
		style:--view-transition-name="banner-{data.post.slug}"
		class="[view-transition-name:var(--view-transition-name)]"
		src={data.post.frontmatter.banner}
		alt=""
		my-4
	/>

	{@html data.post.content}
</main>

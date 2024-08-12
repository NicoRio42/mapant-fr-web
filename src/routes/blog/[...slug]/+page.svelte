<script>
	import { MetaTags } from 'svelte-meta-tags';
	import { WEBSITE_NAME } from '$lib/constants';
	import { page } from '$app/stores';

	export let data;
</script>

<MetaTags
	title="{WEBSITE_NAME} | Blog | {data.post.frontmatter.title}"
	description={data.post.frontmatter.desciption}
	canonical={new URL($page.url.pathname, $page.url.origin).href}
	openGraph={{
		url: new URL($page.url.pathname, $page.url.origin).href,
		locale: 'fr_FR',
		images: [
			{
				url: data.post.frontmatter.banner,
				width: 1107,
				height: 499
			}
		]
	}}
	twitter={{ cardType: 'summary_large_image' }}
/>

<main container max-w-200 m-x-auto py-8 px-4>
	<h1>{data.post.frontmatter.title}</h1>

	<img src={data.post.frontmatter.banner} alt="" class="my-4" />

	{@html data.post.content}
</main>

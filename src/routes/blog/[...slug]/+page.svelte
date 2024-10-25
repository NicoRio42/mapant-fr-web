<script>
	import { MetaTags } from 'svelte-meta-tags';
	import { WEBSITE_NAME } from '$lib/constants';
	import { page } from '$app/stores';

	let { data } = $props();

	const dateFormater = new Intl.DateTimeFormat('fr', { dateStyle: 'short' });
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

<div relative>
	<img
		src={data.post.frontmatter.banner}
		alt=""
		decoding="async"
		w-full
		h-100
		object-cover
		style:--view-transition-name="title-{data.post.slug}"
		class="[view-transition-name:var(--view-transition-name)]"
	/>

	<div absolute right-0 bottom-0 left-0 p="y-4 x-6" bg-gray-800 bg-op-60>
		<h1
			text="10 white left"
			mb-2
			style:--view-transition-name="banner-{data.post.slug}"
			class="[view-transition-name:var(--view-transition-name)]"
		>
			{data.post.frontmatter.title}
		</h1>

		<p text="white 4.5 left" mb-2>
			{data.post.frontmatter.description}
		</p>

		<p text-white mb-2>
			{data.post.frontmatter.author} - {dateFormater.format(new Date(data.post.frontmatter.date))}
		</p>
	</div>
</div>

<main container max-w-200 m-x-auto py-8 px-4>
	{@html data.post.content}
</main>

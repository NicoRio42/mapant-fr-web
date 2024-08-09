<script>
	import { page } from '$app/stores';
	import { WEBSITE_NAME } from '$lib/constants';
	import { MetaTags } from 'svelte-meta-tags';
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
		<li>
			<a href="/blog/karttapullautin-pour-les-nuls">Karttapullautin pour les nuls</a>
		</li>
	</ul>
</main>

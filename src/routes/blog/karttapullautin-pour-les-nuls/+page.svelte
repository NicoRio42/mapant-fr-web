<script>
	import { MetaTags } from 'svelte-meta-tags';
	import content from './karttapullautin-pour-les-nuls.md';
	import { WEBSITE_NAME } from '$lib/constants';
	import { page } from '$app/stores';
</script>

<MetaTags
	title="{WEBSITE_NAME} | Blog | Karttapullautin pour les nuls"
	description="Tutoriel pour générer une carte de course d'orientation avec Karttapullautin"
	canonical={new URL($page.url.pathname, $page.url.origin).href}
	openGraph={{
		url: new URL($page.url.pathname, $page.url.origin).href,
		locale: 'fr_FR',
		images: [
			{
				url: '/karttapullautin-exemple.jpg',
				width: 1107,
				height: 499,
				alt: 'A LiDAR generated orienteering map with karttapullautin'
			}
		]
	}}
	twitter={{ cardType: 'summary_large_image' }}
/>

<main container max-w-200 m-x-auto py-8 px-4>
	<h1>Karttapullautin pour les nuls</h1>

	<enhanced:img
		src="./exemple.jpg"
		alt="Une carte de course d'orientation générée avec Karttapullautin"
		class="my-4"
	/>

	{@html content}
</main>

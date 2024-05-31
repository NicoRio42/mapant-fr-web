<script lang="ts" context="module">
	import { writable } from 'svelte/store';

	const welcomeDialogHasBeenShown = writable(false);
</script>

<script lang="ts">
	import BaseMap from '$lib/components/map/BaseMap.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import welcomePopupContent from './welcome-popup.md';
	import { MetaTags } from 'svelte-meta-tags';
	import { WEBSITE_NAME } from '$lib/constants';
	import { page } from '$app/stores';

	let isWelcomeDialogOpen = false;

	onMount(() => {
		if (!$welcomeDialogHasBeenShown) {
			setTimeout(() => (isWelcomeDialogOpen = true), 2000);
		}

		$welcomeDialogHasBeenShown = true;
	});
</script>

<MetaTags
	title={WEBSITE_NAME}
	description="Une carte de course d'orientation de la France entière (en cours de création)"
	canonical={new URL($page.url.pathname, $page.url.origin).href}
	openGraph={{
		url: new URL($page.url.pathname, $page.url.origin).href,
		locale: 'fr_FR',
		images: [
			{ url: '/facebook.png', width: 1200, height: 630, alt: 'A LiDAR generated orienteering map' },
			{ url: '/whatsapp.png', width: 400, height: 400, alt: 'A LiDAR generated orienteering map' }
		]
	}}
	twitter={{ cardType: 'summary_large_image' }}
/>

{#if isWelcomeDialogOpen}
	<dialog open transition:fade={{ duration: 125 }}>
		<article>
			<div flex>
				<h1 grow>Road to Mapant.fr V2 !</h1>

				<button
					type="button"
					m-0
					p-1
					border-none
					h-fit
					class="outline"
					on:click={() => (isWelcomeDialogOpen = false)}
				>
					<i i-carbon-close-large w-5 h-5 block></i>
				</button>
			</div>

			{@html welcomePopupContent}

			<p text="right 5 gray-6"><em>Nicolas Rio</em></p>

			<p flex justify-end gap-4>
				<button type="button" m-0 class="outline" on:click={() => (isWelcomeDialogOpen = false)}>
					Fermer
				</button>

				<a href="/contribute/step-1" role="button" flex="!~" items-center gap-2 w-fit>
					Contribuer

					<i i-carbon-arrow-right block h-5 w-5></i>
				</a>
			</p>
		</article>
	</dialog>
{/if}

<BaseMap>
	<button
		on:click={() => (isWelcomeDialogOpen = true)}
		type="button"
		absolute
		bottom-6
		right-2
		m-0
		p="x-2 y-1"
		bg-white
		class="outline"
	>
		Message d'accueil
	</button>
</BaseMap>

<style>
	article {
		max-height: calc(100vh - var(--pico-spacing) * 2);
		max-height: calc(100svh - var(--pico-spacing) * 2);
	}
</style>

<script lang="ts" context="module">
	import { writable } from 'svelte/store';

	const welcomeDialogHasBeenShown = writable(false);
</script>

<script lang="ts">
	import BaseMap from '$lib/components/map/BaseMap.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import welcomePopupContent from './welcome-popup.md';

	let isWelcomeDialogOpen = false;

	onMount(() => {
		if (!$welcomeDialogHasBeenShown) {
			setTimeout(() => (isWelcomeDialogOpen = true), 2000);
		}

		$welcomeDialogHasBeenShown = true;
	});
</script>

{#if isWelcomeDialogOpen}
	<dialog open transition:fade={{ duration: 125 }}>
		<article>
			<div flex>
				<h1 grow>Road to Mapant.fr V2 !</h1>

				<button
					type="button"
					p-2
					h-fit
					class="outline"
					on:click={() => (isWelcomeDialogOpen = false)}
				>
					<i i-carbon-close-large w-5 h-5 block></i>
				</button>
			</div>

			{@html welcomePopupContent}

			<p flex justify-end gap-4>
				<button
					type="button"
					p-2
					m-0
					class="outline"
					on:click={() => (isWelcomeDialogOpen = false)}
				>
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

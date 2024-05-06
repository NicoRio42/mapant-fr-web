<script lang="ts">
	import BaseMap from '$lib/components/map/BaseMap.svelte';
	import { marked } from 'marked';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import welcomePopupContent from './welcome-popup.md?raw';

	let isWelcomeDialogOpen = false;

	onMount(() => setTimeout(() => (isWelcomeDialogOpen = true), 3000));
</script>

{#if isWelcomeDialogOpen}
	<dialog open transition:fade>
		<article>
			<div flex>
				<h2 grow>Bienvenu sur Mapant.fr !</h2>

				<button type="button" p-2 class="outline" on:click={() => (isWelcomeDialogOpen = false)}>
					<i i-carbon-close-large w-5 h-5 block></i>
				</button>
			</div>

			{@html marked(welcomePopupContent)}
		</article>
	</dialog>
{/if}

<BaseMap />

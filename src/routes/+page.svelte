<script lang="ts">
	import LidarHdTiles from '$lib/components/map/LidarHdTiles.svelte';
	// import MapLibreLayer from '$lib/components/map/MapLibreLayer.svelte';
	import Mapant from '$lib/components/map/Mapant.svelte';
	import OLMap from '$lib/components/map/OLMap.svelte';
	import Osm from '$lib/components/map/OSM.svelte';
	import { onMount } from 'svelte';

	let isWelcomeDialogOpen = false;

	onMount(() => setTimeout(() => (isWelcomeDialogOpen = true), 3000));
</script>

{#if isWelcomeDialogOpen}
	<dialog open>
		<article>
			<div flex>
				<h2 grow>Bienvenu sur Mapant.fr !</h2>

				<button type="button" p-2 class="outline" on:click={() => (isWelcomeDialogOpen = false)}>
					<i i-carbon-close-large w-5 h-5 block></i>
				</button>
			</div>

			<p>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Porro adipisci, repellendus dolor
				veritatis labore numquam doloribus beatae magnam ullam officia iusto accusantium architecto
				obcaecati expedita consequatur dicta asperiores nihil rem.
			</p>

			<p>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Porro adipisci, repellendus dolor
				veritatis labore numquam doloribus beatae magnam ullam officia iusto accusantium architecto
				obcaecati expedita consequatur dicta asperiores nihil rem.
			</p>

			<p>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Porro adipisci, repellendus dolor
				veritatis labore numquam doloribus beatae magnam ullam officia iusto accusantium architecto
				obcaecati expedita consequatur dicta asperiores nihil rem.
			</p>

			<p>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Porro adipisci, repellendus dolor
				veritatis labore numquam doloribus beatae magnam ullam officia iusto accusantium architecto
				obcaecati expedita consequatur dicta asperiores nihil rem.
			</p>

			<p>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Porro adipisci, repellendus dolor
				veritatis labore numquam doloribus beatae magnam ullam officia iusto accusantium architecto
				obcaecati expedita consequatur dicta asperiores nihil rem.
			</p>

			<p>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Porro adipisci, repellendus dolor
				veritatis labore numquam doloribus beatae magnam ullam officia iusto accusantium architecto
				obcaecati expedita consequatur dicta asperiores nihil rem.
			</p>
		</article>
	</dialog>
{/if}

<main grow>
	<OLMap>
		<Osm />
		<!-- <MapLibreLayer /> -->
		<Mapant />
		<LidarHdTiles />
	</OLMap>
</main>

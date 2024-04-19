<script lang="ts">
	import LidarHdTiles from '$lib/components/map/LidarHdTiles.svelte';
	// import MapLibreLayer from '$lib/components/map/MapLibreLayer.svelte';
	import Mapant from '$lib/components/map/Mapant.svelte';
	import OLMap from '$lib/components/map/OLMap.svelte';
	import Osm from '$lib/components/map/OSM.svelte';
	import { onMount } from 'svelte';

	let isWelcomeDialogOpen = false;
	let isMapantV1LayerDisplayed = true;
	let isOpenTopoMapLayerDisplayed = true;
	let isLidarHdTilesLayerDisplayed = true;

	// onMount(() => setTimeout(() => (isWelcomeDialogOpen = true), 3000));
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

<main grow relative>
	<OLMap>
		{#key (isOpenTopoMapLayerDisplayed ? 'osm-on' : 'osm-off') + '-' + (isMapantV1LayerDisplayed ? 'mapant-on' : 'mapant-off') + '-' + (isLidarHdTilesLayerDisplayed ? 'lidar-on' : 'lidar-off')}
			{#if isOpenTopoMapLayerDisplayed}
				<Osm />
			{/if}

			<!-- <MapLibreLayer /> -->
			{#if isMapantV1LayerDisplayed}
				<Mapant />
			{/if}

			{#if isLidarHdTilesLayerDisplayed}
				<LidarHdTiles />
			{/if}
		{/key}
	</OLMap>

	<div absolute top-2 right-2>
		<details class="dropdown">
			<summary role="button" p-2.5>
				<i i-carbon-layers w-5 h-5 block></i>
			</summary>

			<ul dir="rtl">
				<li text-left>
					<label>
						Mapant.fr V1
						<input mr-2 type="checkbox" bind:checked={isMapantV1LayerDisplayed} />
					</label>
				</li>

				<li text-left>
					<label>
						OpenTopoMap
						<input mr-2 type="checkbox" bind:checked={isOpenTopoMapLayerDisplayed} />
					</label>
				</li>

				<li text-left>
					<label>
						Données LiDAR disponible
						<input mr-2 type="checkbox" bind:checked={isLidarHdTilesLayerDisplayed} />
					</label>
				</li>
			</ul>
		</details>
	</div>
</main>

<style>
	summary::after {
		display: none !important;
	}
</style>

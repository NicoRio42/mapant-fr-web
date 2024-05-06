<script lang="ts">
	import LidarHdTiles from '$lib/components/map/LidarHdTiles.svelte';
	import Mapant from '$lib/components/map/Mapant.svelte';
	import OLMap from '$lib/components/map/OLMap.svelte';
	import Osm from '$lib/components/map/OSM.svelte';
	import { FRANCE_CENTER } from '$lib/constants';

	export let center = FRANCE_CENTER;
	export let zoom = 6;

	let isMapantV1LayerDisplayed = true;
	let isOpenTopoMapLayerDisplayed = true;
	let isLidarHdTilesLayerDisplayed = true;
</script>

<main grow relative>
	<OLMap bind:center {zoom}>
		{#key (isOpenTopoMapLayerDisplayed ? 'osm-on' : 'osm-off') + '-' + (isMapantV1LayerDisplayed ? 'mapant-on' : 'mapant-off') + '-' + (isLidarHdTilesLayerDisplayed ? 'lidar-on' : 'lidar-off')}
			{#if isOpenTopoMapLayerDisplayed}
				<Osm />
			{/if}

			{#if isMapantV1LayerDisplayed}
				<Mapant />
			{/if}

			{#if isLidarHdTilesLayerDisplayed}
				<LidarHdTiles />
			{/if}
		{/key}

		<slot></slot>
	</OLMap>

	<div absolute top-2 right-2>
		<details class="dropdown">
			<!-- svelte-ignore a11y-no-redundant-roles -->
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

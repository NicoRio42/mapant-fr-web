<script lang="ts">
	import LidarHdTiles from '$lib/components/map/LidarHdTiles.svelte';
	import Mapant from '$lib/components/map/Mapant.svelte';
	import OLMap from '$lib/components/map/OLMap.svelte';
	import { FRANCE_CENTER } from '$lib/constants';
	import type { Feature } from 'ol';
	import Osm from './OSM.svelte';
	import Scan25IgnWebMercator from './Scan25IgnWebMercator.svelte';

	export let center = FRANCE_CENTER;
	export let zoom = 6;
	export let allowLidarTileSelection = false;
	export let selected: Feature | null = null;

	let isOsmLayerDisplayed = false;
	let isIgnScan25LayerDisplayed = true;
	let isMapantV1LayerDisplayed = true;
	let isLidarHdTilesLayerDisplayed = true;

	let osmLayerOpacity = 0.5;
	let ignScan25LayerOpacity = 0.5;
	let mapantV1LayerOpacity = 1;
	let lidarHdTilesLayerOpacity = 1;
</script>

<main grow relative bg-white>
	<OLMap bind:center {zoom}>
		<Osm visible={isOsmLayerDisplayed} opacity={osmLayerOpacity} />

		<Scan25IgnWebMercator visible={isIgnScan25LayerDisplayed} opacity={ignScan25LayerOpacity} />

		<Mapant visible={isMapantV1LayerDisplayed} opacity={mapantV1LayerOpacity} />

		<LidarHdTiles
			visible={isLidarHdTilesLayerDisplayed}
			opacity={lidarHdTilesLayerOpacity}
			allowSelection={allowLidarTileSelection}
			bind:selected
		/>

		<slot></slot>
	</OLMap>

	<div absolute top-2 right-2>
		<details class="dropdown">
			<!-- svelte-ignore a11y-no-redundant-roles -->
			<summary role="button" p-2.5 bg-white class="outline">
				<i i-carbon-layers w-5 h-5 block></i>
			</summary>

			<ul dir="rtl">
				<li text-left>
					<label>
						OpenStreetMap
						<input mr-2 type="checkbox" bind:checked={isOsmLayerDisplayed} />
					</label>

					<input dir="ltr" type="range" min="0" max="1" step="0.01" bind:value={osmLayerOpacity} />
				</li>

				<li text-left>
					<label>
						Mapant.fr V1
						<input mr-2 type="checkbox" bind:checked={isMapantV1LayerDisplayed} />
					</label>

					<input
						dir="ltr"
						type="range"
						min="0"
						max="1"
						step="0.01"
						bind:value={mapantV1LayerOpacity}
					/>
				</li>

				<li text-left>
					<label>
						IGN Scan25
						<input mr-2 type="checkbox" bind:checked={isIgnScan25LayerDisplayed} />
					</label>

					<input
						dir="ltr"
						type="range"
						min="0"
						max="1"
						step="0.01"
						bind:value={ignScan25LayerOpacity}
					/>
				</li>

				<li text-left>
					<label>
						Données LiDAR disponible
						<input mr-2 type="checkbox" bind:checked={isLidarHdTilesLayerDisplayed} />
					</label>

					<input
						dir="ltr"
						type="range"
						min="0"
						max="1"
						step="0.01"
						bind:value={lidarHdTilesLayerOpacity}
					/>
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

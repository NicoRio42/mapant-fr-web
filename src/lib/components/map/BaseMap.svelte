<script lang="ts">
	import LidarHdTiles from '$lib/components/map/LidarHdTiles.svelte';
	import Mapant from '$lib/components/map/Mapant.svelte';
	import OLMap from '$lib/components/map/OLMap.svelte';
	import { FRANCE_CENTER, MAPANT_V1_CENTER, MAPANT_V1_EXTENT } from '$lib/constants';
	import type { Feature, Map } from 'ol';
	import type { Extent } from 'ol/extent';
	import type { SimpleGeometry } from 'ol/geom';
	import Osm from './OSM.svelte';
	import Scan25IgnWebMercator from './Scan25IgnWebMercator.svelte';

	export let center = FRANCE_CENTER;
	export let zoom = 6;
	export let allowLidarTileSelection = false;
	export let selected: Feature | null = null;
	export let fit: SimpleGeometry | Extent | undefined = undefined;

	let map: Map | undefined = undefined;
	let layersDropdown: HTMLDetailsElement;

	let isOsmLayerDisplayed = false;
	let isIgnScan25LayerDisplayed = true;
	let isMapantV1LayerDisplayed = true;
	export let isLidarHdTilesLayerDisplayed = true;

	let osmLayerOpacity = 0.5;
	let ignScan25LayerOpacity = 0.5;
	let mapantV1LayerOpacity = 1;
	let lidarHdTilesLayerOpacity = 1;
</script>

<main grow relative bg-white>
	<OLMap bind:map bind:center {fit} {zoom}>
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
		<details class="dropdown" bind:this={layersDropdown}>
			<!-- svelte-ignore a11y-no-redundant-roles -->
			<summary role="button" p-2.5 bg-white class="outline">
				<i i-carbon-layers w-5 h-5 block></i>
			</summary>

			<ul dir="rtl" py="!4">
				<li text-left bg="!hover:transparent">
					<label>
						OpenStreetMap
						<input mr-2 type="checkbox" bind:checked={isOsmLayerDisplayed} />
					</label>

					<input
						dir="ltr"
						type="range"
						min="0"
						max="1"
						step="0.01"
						bind:value={osmLayerOpacity}
						mb="!0"
					/>
				</li>

				<li text-left bg="!hover:transparent">
					<div flex items-center dir="ltr" mb="[calc(var(--pico-spacing)*0.375)]">
						<label grow dir="rtl" mb-0>
							Mapant.fr V1
							<input mr-2 type="checkbox" bind:checked={isMapantV1LayerDisplayed} />
						</label>

						<button
							type="button"
							class="outline"
							p-1
							m-0
							on:click={() => {
								if (map === undefined) return;
								const view = map.getView();
								const resolution = view.getResolutionForExtent(MAPANT_V1_EXTENT);
								layersDropdown.removeAttribute('open');
								view.animate({ resolution, center: MAPANT_V1_CENTER });
							}}
						>
							<i i-carbon-zoom-fit block w-6 h-6></i>
						</button>
					</div>

					<input
						dir="ltr"
						type="range"
						min="0"
						max="1"
						step="0.01"
						bind:value={mapantV1LayerOpacity}
						mb="!0"
					/>
				</li>

				<li text-left bg="!hover:transparent">
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
						mb="!0"
					/>
				</li>

				<li text-left bg="!hover:transparent">
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
						mb="!0"
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

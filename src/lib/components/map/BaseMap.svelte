<script lang="ts">
	import { clickOutside } from '$lib/actions/click-outside';
	import LidarHdTiles from '$lib/components/map/LidarHdTiles.svelte';
	import Mapant from '$lib/components/map/Mapant.svelte';
	import OLMap from '$lib/components/map/OLMap.svelte';
	import { FRANCE_CENTER, MAPANT_V1_CENTER, MAPANT_V1_EXTENT } from '$lib/constants';
	import type { Feature, Map } from 'ol';
	import type { Extent } from 'ol/extent';
	import type { SimpleGeometry } from 'ol/geom';
	import { fade } from 'svelte/transition';
	import LayerControlItem from './LayerControlItem.svelte';
	import Osm from './OSM.svelte';
	import Scan25IgnWebMercator from './Scan25IgnWebMercator.svelte';


	let map: Map | undefined = $state(undefined);
	let showLayerDropDown = $state(false);

	let isOsmLayerDisplayed = $state(false);
	let isIgnScan25LayerDisplayed = $state(true);
	let isMapantV1LayerDisplayed = $state(true);
	interface Props {
		center?: any;
		zoom?: number;
		allowLidarTileSelection?: boolean;
		selected?: Feature | null;
		fit?: SimpleGeometry | Extent | undefined;
		isLidarHdTilesLayerDisplayed?: boolean;
		children?: import('svelte').Snippet;
	}

	let {
		center = $bindable(FRANCE_CENTER),
		zoom = 6,
		allowLidarTileSelection = false,
		selected = $bindable(null),
		fit = undefined,
		isLidarHdTilesLayerDisplayed = $bindable(true),
		children
	}: Props = $props();

	let osmLayerOpacity = $state(0.5);
	let ignScan25LayerOpacity = $state(0.5);
	let mapantV1LayerOpacity = $state(1);
	let lidarHdTilesLayerOpacity = $state(1);
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

		{@render children?.()}
	</OLMap>

	<div
		absolute
		top-2
		right-2
		flex="~ col"
		items-end
		gap-2
		use:clickOutside={() => (showLayerDropDown = false)}
	>
		<button
			flex
			items-center
			justify-center
			w-8
			h-8
			p-0
			bg-white
			class="outline"
			onclick={() => (showLayerDropDown = !showLayerDropDown)}
		>
			<i i-carbon-layers w-5 h-5 block></i>
		</button>

		{#if showLayerDropDown}
			<ul p-4 m-0 rounded shadow-2xl bg-background-color transition:fade={{ duration: 125 }}>
				<LayerControlItem
					label="OpenStreetMap"
					bind:displayed={isOsmLayerDisplayed}
					bind:opacity={osmLayerOpacity}
				/>

				<LayerControlItem
					label="Mapant.fr V1"
					bind:displayed={isMapantV1LayerDisplayed}
					bind:opacity={mapantV1LayerOpacity}
				>
					<button
						type="button"
						class="outline"
						p-1
						m-0
						onclick={() => {
							if (map === undefined) return;
							isMapantV1LayerDisplayed = true;
							mapantV1LayerOpacity = 1;
							const view = map.getView();
							const resolution = view.getResolutionForExtent(MAPANT_V1_EXTENT);
							showLayerDropDown = false;
							view.animate({ resolution, center: MAPANT_V1_CENTER, rotation: 0 });
						}}
					>
						<i i-carbon-zoom-fit block w-6 h-6></i>
					</button>
				</LayerControlItem>

				<LayerControlItem
					label="IGN Scan25"
					bind:displayed={isIgnScan25LayerDisplayed}
					bind:opacity={ignScan25LayerOpacity}
				/>

				<LayerControlItem
					label="Données LiDAR disponibles"
					bind:displayed={isLidarHdTilesLayerDisplayed}
					bind:opacity={lidarHdTilesLayerOpacity}
				/>
			</ul>
		{/if}
	</div>
</main>

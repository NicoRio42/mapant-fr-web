<script lang="ts">
	import { clickOutside } from '$lib/actions/click-outside';
	import LidarHdTiles from '$lib/components/map/LidarHdTiles.svelte';
	import MapantLegacy from '$lib/components/map/MapantLegacy.svelte';
	import Mapant from '$lib/components/map/Mapant.svelte';
	import OLMap from '$lib/components/map/OLMap.svelte';
	import { MAPANT_V1_CENTER, MAPANT_V1_EXTENT } from '$lib/constants';
	import type { Feature, Map } from 'ol';
	import type { Extent } from 'ol/extent';
	import { fade } from 'svelte/transition';
	import LayerControlItem from './LayerControlItem.svelte';
	import Osm from './OSM.svelte';
	import Scan25IgnWebMercator from './Scan25IgnWebMercator.svelte';
	import type { Coordinate } from 'ol/coordinate';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let map: Map | undefined = $state(undefined);
	let showLayerDropDown = $state(false);
	let isOsmLayerDisplayed = $state(false);
	let isIgnScan25LayerDisplayed = $state(true);
	let isMapantV1LayerDisplayed = $state(false);
	let isMapantLayerDisplayed = $state(true);

	interface Props {
		center?: Coordinate;
		zoom?: number;
		allowLidarTileSelection?: boolean;
		selected?: Feature | null;
		fit?: Extent;
		isLidarHdTilesLayerDisplayed?: boolean;
		onViewChange?: (params: {
			zoom: number;
			extent: Extent;
			center: Coordinate;
			rotation: number;
		}) => void;
		children?: import('svelte').Snippet;
		class?: string;
		persistMapState?: boolean;
	}

	let {
		center,
		allowLidarTileSelection = false,
		selected = $bindable(null),
		zoom = 6,
		fit,
		isLidarHdTilesLayerDisplayed = $bindable(false),
		onViewChange,
		children,
		class: classList,
		persistMapState = false
	}: Props = $props();

	let osmLayerOpacity = $state(0.5);
	let ignScan25LayerOpacity = $state(0.25);
	let mapantV1LayerOpacity = $state(1);
	let mapantLayerOpacity = $state(1);
	let lidarHdTilesLayerOpacity = $state(1);
	let rotation = $state(0);

	function onViewChangeCombined(params: {
		zoom: number;
		extent: Extent;
		center: Coordinate;
		rotation: number;
	}) {
		onViewChange?.(params);
		if (!persistMapState) return;

		localStorage.setItem(
			'mapState',
			`${params.zoom}|${params.center[0]}|${params.center[1]}|${params.rotation}`
		);
	}

	onMount(() => {
		if (!persistMapState) return;
		let mapState = localStorage.getItem('mapState');
		if (mapState === null) return;

		const [zoomLocalStorage, centerLatLocalStorage, centerLonLocalStorage, rotationLocalStorage] =
			mapState.split('|').map((s) => parseFloat(s));

		center = [centerLatLocalStorage, centerLonLocalStorage];
		zoom = zoomLocalStorage;
		rotation = rotationLocalStorage;
	});
</script>

<main grow relative bg-white class={classList}>
	<OLMap bind:map {center} {fit} {zoom} {rotation} onViewChange={onViewChangeCombined}>
		<Osm visible={isOsmLayerDisplayed} opacity={osmLayerOpacity} />

		<Scan25IgnWebMercator visible={isIgnScan25LayerDisplayed} opacity={ignScan25LayerOpacity} />

		<MapantLegacy visible={isMapantV1LayerDisplayed} opacity={mapantV1LayerOpacity} />

		<Mapant visible={isMapantLayerDisplayed} opacity={mapantLayerOpacity} />

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
					label="IGN Scan25"
					bind:displayed={isIgnScan25LayerDisplayed}
					bind:opacity={ignScan25LayerOpacity}
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
					label="Mapant.fr"
					bind:displayed={isMapantLayerDisplayed}
					bind:opacity={mapantLayerOpacity}
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

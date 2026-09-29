<script lang="ts">
	import { browser } from '$app/env';
	import { page } from '$app/state';
	import { MAPANT_TILES_BASE_URL } from './mapant-tile-url.js';
	import { type Map } from 'ol';
	import TileLayer from 'ol/layer/Tile';
	import XYZ from 'ol/source/XYZ';
	import { TileGrid } from 'ol/tilegrid';
	import { getContext, onDestroy, onMount } from 'svelte';
	import {
		MAPANT_MAX_Y,
		MAPANT_MIN_X,
		MAPANT_RESOLUTIONS,
		MAPANT_TILE_SIZE
	} from './mapant-tile-grid.js';

	interface Props {
		visible?: boolean;
		opacity?: number;
	}

	let { visible = true, opacity = 1 }: Props = $props();

	const getMap = getContext<() => Map>('map');
	let map: Map;
	let tileLayer: TileLayer<XYZ> | undefined = $state();

	$effect(() => {
		if (browser && tileLayer) tileLayer.setVisible(visible);
	});

	$effect(() => {
		if (browser && tileLayer) tileLayer.setOpacity(opacity);
	});

	onMount(() => {
		map = getMap();

		const url = `${MAPANT_TILES_BASE_URL}/{z}/{x}/{y}.webp${page.url.searchParams.has('bypass-cache') ? `?${new Date().getTime()}` : ''}`;
		const tileGrid = new TileGrid({
			origin: [MAPANT_MIN_X, MAPANT_MAX_Y],
			resolutions: MAPANT_RESOLUTIONS,
			tileSize: MAPANT_TILE_SIZE
		});

		tileLayer = new TileLayer({
			source: new XYZ({
				url,
				projection: 'EPSG:2154',
				tileGrid,
				attributions: [
					'© <a href="https://www.ign.fr/" target="_blank">IGN</a>',
					'© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
				]
			}),
			zIndex: 1,
			visible,
			opacity
		});

		map?.addLayer(tileLayer);
	});

	onDestroy(() => {
		if (map !== undefined && tileLayer !== undefined) map.removeLayer(tileLayer);
	});
</script>

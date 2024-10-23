<script lang="ts">
	import { run } from 'svelte/legacy';

	import { browser } from '$app/environment';
	import { MAPANT_V1_EXTENT, TILES_BASE_URL } from '$lib/constants';
	import { type Map } from 'ol';
	import TileLayer from 'ol/layer/Tile';
	import XYZ from 'ol/source/XYZ';
	import { TileGrid } from 'ol/tilegrid';
	import { getContext, onDestroy, onMount } from 'svelte';

	interface Props {
		visible?: boolean;
		opacity?: number;
	}

	let { visible = true, opacity = 1 }: Props = $props();

	const getMap = getContext<() => Map>('map');
	let map: Map;
	let tileLayer: TileLayer<XYZ> = $state();

	run(() => {
		if (browser && tileLayer) tileLayer.setVisible(visible);
	});
	run(() => {
		if (browser && tileLayer) tileLayer.setOpacity(opacity);
	});

	// Quick fix to solve a for now unexplained offset problem
	const OFFSET_X = 934407.1834580749 - 934553.3735946362;
	const OFFSET_Y = 6592214.102672428 - 6592176.256494943;

	// Constants computed to cover the whole metropolitan France
	const MIN_X = -343646 - OFFSET_X;
	const MAX_X = 1704354 - OFFSET_X;
	const MIN_Y = 5619537 - OFFSET_Y;
	const MAX_Y = 7667537 - OFFSET_Y;
	const TILE_SIZE = 256;

	const maxResolution = (MAX_X - MIN_X) / TILE_SIZE;
	const resolutions: number[] = [];

	for (let z = 0; z <= 13; z++) {
		resolutions[z] = maxResolution / Math.pow(2, z);
	}

	onMount(() => {
		map = getMap();

		const url = `${TILES_BASE_URL}/{z}/{x}/{y}.png`;

		const tileGrid = new TileGrid({
			origin: [MIN_X, MAX_Y],
			resolutions,
			tileSize: TILE_SIZE
		});

		tileLayer = new TileLayer({
			source: new XYZ({
				url,
				projection: 'EPSG:2154',
				tileGrid
			}),
			zIndex: 1,
			visible,
			opacity,
			extent: MAPANT_V1_EXTENT
		});

		map?.addLayer(tileLayer);
	});

	onDestroy(() => {
		if (map !== undefined && tileLayer !== undefined) map.removeLayer(tileLayer);
	});
</script>

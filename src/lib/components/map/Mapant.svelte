<script lang="ts">
	import { browser } from '$app/environment';
	import { PUBLIC_MAPANT_TILES_BASE_URL } from '$env/static/public';
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
	let tileLayer: TileLayer<XYZ> | undefined = $state();

	$effect(() => {
		if (browser && tileLayer) tileLayer.setVisible(visible);
	});

	$effect(() => {
		if (browser && tileLayer) tileLayer.setOpacity(opacity);
	});

	// Quick fix to solve a for now unexplained offset problem
	const OFFSET_X = 1001902.433647273 - 1002549.3574821977;
	const OFFSET_Y = 6830472.450035284 - 6830938.372790006;

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
		const url = `${PUBLIC_MAPANT_TILES_BASE_URL}/{z}/{x}/{y}.png`;

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
			opacity
		});

		map?.addLayer(tileLayer);
	});

	onDestroy(() => {
		if (map !== undefined && tileLayer !== undefined) map.removeLayer(tileLayer);
	});
</script>

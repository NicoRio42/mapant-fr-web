<script lang="ts">
	import { browser } from '$app/environment';
	import { TILES_BASE_URL } from '$lib/constants';
	import { type Map } from 'ol';
	import TileLayer from 'ol/layer/Tile';
	import XYZ from 'ol/source/XYZ';
	import { TileGrid } from 'ol/tilegrid';
	import { getContext, onDestroy, onMount } from 'svelte';

	export let visible = true;
	export let opacity = 1;

	const getMap = getContext<() => Map>('map');
	let map: Map;
	let tileLayer: TileLayer<XYZ>;

	$: if (browser && tileLayer) tileLayer.setVisible(visible);
	$: if (browser && tileLayer) tileLayer.setOpacity(opacity);

	/**
	 * Constants computed to cover the whole metropolitan France
	 */
	const MIN_X = -343646;
	const MAX_X = 1704354;
	const MIN_Y = 5619537;
	const MAX_Y = 7667537;
	const TILE_SIZE = 256;

	const EXTENT_MIN_X = 907636.8207740805;
	const EXTENT_MAX_X = 972720.8671417263;
	const EXTENT_MIN_Y = 6542186.808607884;
	const EXTENT_MAX_Y = 6596005.251042297;

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
			extent: [EXTENT_MIN_X, EXTENT_MIN_Y, EXTENT_MAX_X, EXTENT_MAX_Y]
		});

		map?.addLayer(tileLayer);
	});

	onDestroy(() => {
		if (map !== undefined && tileLayer !== undefined) map.removeLayer(tileLayer);
	});
</script>

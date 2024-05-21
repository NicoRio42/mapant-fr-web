<script lang="ts">
	import { browser } from '$app/environment';
	import type { Map } from 'ol';
	import TileLayer from 'ol/layer/Tile';
	import OSM from 'ol/source/OSM';
	import { getContext, onDestroy, onMount } from 'svelte';

	export let visible = true;
	export let opacity = 1;

	const getMap = getContext<() => Map>('map');
	let map: Map;
	let tileLayer: TileLayer<OSM>;

	$: if (browser && tileLayer) tileLayer.setVisible(visible);
	$: if (browser && tileLayer) tileLayer.setOpacity(opacity);

	onMount(() => {
		map = getMap();

		tileLayer = new TileLayer({ zIndex: 0, visible, opacity });

		const source = new OSM();
		tileLayer.setSource(source);

		map?.addLayer(tileLayer);
	});

	onDestroy(() => {
		if (map !== undefined && tileLayer !== undefined) map.removeLayer(tileLayer);
	});
</script>

<script lang="ts">
	import { run } from 'svelte/legacy';

	import { browser } from '$app/environment';
	import type { Map } from 'ol';
	import TileLayer from 'ol/layer/Tile';
	import OSM from 'ol/source/OSM';
	import { getContext, onDestroy, onMount } from 'svelte';

	interface Props {
		visible?: boolean;
		opacity?: number;
	}

	let { visible = true, opacity = 1 }: Props = $props();

	const getMap = getContext<() => Map>('map');
	let map: Map;
	let tileLayer: TileLayer<OSM> = $state();

	run(() => {
		if (browser && tileLayer) tileLayer.setVisible(visible);
	});
	run(() => {
		if (browser && tileLayer) tileLayer.setOpacity(opacity);
	});

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

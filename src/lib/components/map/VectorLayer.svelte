<script lang="ts">
	import type { Feature, Map } from 'ol';
	import type { Geometry } from 'ol/geom.js';
	import VectorLayer from 'ol/layer/Vector.js';
	import VectorSource from 'ol/source/Vector.js';
	import { getContext, onDestroy, onMount, setContext } from 'svelte';

	const getMap = getContext<() => Map>('map');
	let vectorLayer: VectorLayer<VectorSource<Feature<Geometry>>>, map: Map;

	setContext('vectorLayer', () => vectorLayer);

	onMount(() => {
		map = getMap();
		vectorLayer = new VectorLayer({ zIndex: 2 });
		const vectorSource = new VectorSource();
		vectorLayer.setSource(vectorSource);

		map?.addLayer(vectorLayer);
	});

	onDestroy(() => {
		if (map !== undefined && vectorLayer !== undefined) map.removeLayer(vectorLayer);
	});
</script>

{#if vectorLayer}
	<slot />
{/if}

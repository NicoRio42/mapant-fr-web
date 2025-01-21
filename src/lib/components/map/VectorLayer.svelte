<script lang="ts">
	import type { Feature, Map } from 'ol';
	import type { Geometry } from 'ol/geom.js';
	import VectorLayer from 'ol/layer/Vector.js';
	import VectorSource from 'ol/source/Vector.js';
	import { getContext, onDestroy, onMount, setContext } from 'svelte';
	interface Props {
		zIndex?: number;
		children?: import('svelte').Snippet;
	}

	let { zIndex = 2, children }: Props = $props();

	const getMap = getContext<() => Map>('map');
	let vectorLayer: VectorLayer<Feature<Geometry>> | undefined = $state(),
		map: Map;

	setContext('vectorLayer', () => vectorLayer);

	onMount(() => {
		map = getMap();
		vectorLayer = new VectorLayer({ zIndex });
		const vectorSource = new VectorSource();
		vectorLayer.setSource(vectorSource);

		map?.addLayer(vectorLayer);
	});

	onDestroy(() => {
		if (map !== undefined && vectorLayer !== undefined) map.removeLayer(vectorLayer);
	});
</script>

{#if vectorLayer}
	{@render children?.()}
{/if}

<script lang="ts">
	import type { Map } from 'ol';
	import type { Extent } from 'ol/extent';
	import ImageLayer from 'ol/layer/Image.js';
	import ImageSource from 'ol/source/Image.js';
	import Static from 'ol/source/ImageStatic';
	import { getContext, onDestroy, onMount } from 'svelte';

	interface Props {
		children?: import('svelte').Snippet;
		url: string;
		extent: Extent;
		zIndex?: number;
	}

	let { url, extent, zIndex = 1, children }: Props = $props();

	const getMap = getContext<() => Map>('map');

	let imageLayer: ImageLayer<ImageSource> | undefined = $state(),
		map: Map;

	onMount(() => {
		map = getMap();

		imageLayer = new ImageLayer({
			zIndex,
			source: new Static({
				url,
				imageExtent: extent
			})
		});

		map?.addLayer(imageLayer);
	});

	onDestroy(() => {
		if (map !== undefined && imageLayer !== undefined) map.removeLayer(imageLayer);
	});
</script>

{#if imageLayer}
	{@render children?.()}
{/if}

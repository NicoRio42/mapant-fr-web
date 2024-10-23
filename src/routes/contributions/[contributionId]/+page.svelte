<script lang="ts">
	import BaseMap from '$lib/components/map/BaseMap.svelte';
	import Polygon from '$lib/components/map/Polygon.svelte';
	import VectorLayer from '$lib/components/map/VectorLayer.svelte';
	import type { Extent } from 'ol/extent.js';

	let { data } = $props();

	const fit: Extent = [
		data.contribution.minX,
		data.contribution.minY,
		data.contribution.maxX,
		data.contribution.maxY
	];

	const coordinates = [
		[data.contribution.minX, data.contribution.maxY],
		[data.contribution.maxX, data.contribution.maxY],
		[data.contribution.maxX, data.contribution.minY],
		[data.contribution.minX, data.contribution.minY]
	];
</script>

<BaseMap {fit}>
	<VectorLayer>
		<Polygon color="blue" width={2} coords={coordinates} fill="#60a5fa4a" />
	</VectorLayer>
</BaseMap>

<script lang="ts">
	import BaseMap from '$lib/components/map/BaseMap.svelte';
	import Polygon from '$lib/components/map/Polygon.svelte';
	import VectorLayer from '$lib/components/map/VectorLayer.svelte';

	export let data;
</script>

<BaseMap>
	<VectorLayer>
		{#each data.contributions as contribution (contribution.id)}
			{@const coordinates = [
				[contribution.minX, contribution.maxY],
				[contribution.maxX, contribution.maxY],
				[contribution.maxX, contribution.minY],
				[contribution.minX, contribution.minY]
			]}

			<Polygon color="blue" width={2} coords={coordinates} fill="#60a5fa4a" />
		{/each}
	</VectorLayer>
</BaseMap>

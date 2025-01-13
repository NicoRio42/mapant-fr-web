<script lang="ts">
	import { enhance } from '$app/forms';
	import BaseMap from '$lib/components/map/BaseMap.svelte';
	import DrawBox from '$lib/components/map/DrawBox.svelte';
	import Polygon from '$lib/components/map/Polygon.svelte';
	import VectorLayer from '$lib/components/map/VectorLayer.svelte';
	import { tick } from 'svelte';

	let { data } = $props();

	let isDrawing = $state(false);
	let minX: number | null = $state(null);
	let maxX: number | null = $state(null);
	let minY: number | null = $state(null);
	let maxY: number | null = $state(null);
	let submitButton: HTMLButtonElement | undefined = $state();
</script>

<form hidden method="post" use:enhance>
	<input type="hidden" name="minX" bind:value={minX} />
	<input type="hidden" name="maxX" bind:value={maxX} />
	<input type="hidden" name="minY" bind:value={minY} />
	<input type="hidden" name="maxY" bind:value={maxY} />
	<button type="submit" bind:this={submitButton}></button>
</form>

<BaseMap>
	<button
		absolute
		top-12
		right-2
		flex
		items-center
		justify-center
		w-8
		h-8
		p-0
		bg-white
		class="outline"
		onclick={() => (isDrawing = !isDrawing)}
	>
		<i i-carbon-edit w-5 h-5 block></i>
	</button>

	{#if isDrawing}
		<DrawBox
			ondrawend={async (e) => {
				if (!confirm('Sûr ?')) return;
				const extent = e.feature.getGeometry()?.getExtent();

				if (!extent) {
					isDrawing = false;
					return;
				}

				[minX, minY, maxX, maxY] = extent;
				console.log(minX, minY, maxX, maxY);
				await tick();
				submitButton?.click();
				isDrawing = false;
			}}
		/>
	{/if}

	<VectorLayer>
		{#each data.contributions as { contribution, user } (contribution.id)}
			{@const coordinates = [
				[contribution.minX, contribution.maxY],
				[contribution.maxX, contribution.maxY],
				[contribution.maxX, contribution.minY],
				[contribution.minX, contribution.minY]
			]}

			<Polygon color="blue" width={2} coords={coordinates} fill="#60a5fa4a" text={user.email} />
		{/each}

		{#each data.areas as area (area.id)}
			{@const coordinates = [
				[area.minX, area.maxY],
				[area.maxX, area.maxY],
				[area.maxX, area.minY],
				[area.minX, area.minY]
			]}

			<Polygon color="green" width={2} coords={coordinates} fill="#60a5fa4a" />
		{/each}
	</VectorLayer>
</BaseMap>

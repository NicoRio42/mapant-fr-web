<script lang="ts">
	import { enhance } from '$app/forms';
	import { confirmSubmit } from '$lib/actions/confirm-submit.js';
	import BaseMap from '$lib/components/map/BaseMap.svelte';
	import DrawBox from '$lib/components/map/DrawBox.svelte';
	import Polygon from '$lib/components/map/Polygon.svelte';
	import StaticImage from '$lib/components/map/StaticImage.svelte';
	import VectorLayer from '$lib/components/map/VectorLayer.svelte';
	import type { Extent } from 'ol/extent.js';
	import { tick } from 'svelte';
	import type { Tile } from '$lib/server/schema.js';

	let { data } = $props();

	let isDrawing = $state(false);
	let minX: number | null = $state(null);
	let maxX: number | null = $state(null);
	let minY: number | null = $state(null);
	let maxY: number | null = $state(null);
	let submitButton: HTMLButtonElement | undefined = $state();
	let selectedAreaId: null | string = $state(null);
	let displayedTiles: Tile[] = $state([]);

	async function onViewChange({ zoom, extent }: { zoom: number; extent: Extent }) {
		if (!isDrawing || zoom < 13) {
			displayedTiles = [];
			return;
		}

		const [minX, minY, maxX, maxY] = extent;

		const response = await fetch(
			`/admin/areas/tiles?min-x=${minX}&min-y=${minY}&max-x=${maxX}&max-y=${maxY}`
		);

		if (!response.ok) {
			console.error(response.status, await response.text());
			return;
		}

		displayedTiles = await response.json();
	}
</script>

<form hidden action="?/add" method="post" use:enhance>
	<input type="hidden" name="minX" bind:value={minX} />
	<input type="hidden" name="maxX" bind:value={maxX} />
	<input type="hidden" name="minY" bind:value={minY} />
	<input type="hidden" name="maxY" bind:value={maxY} />
	<button type="submit" bind:this={submitButton}></button>
</form>

{#if selectedAreaId !== null}
	<dialog open>
		<article>
			<ul>
				<li>
					<form action="?/delete" method="post" use:confirmSubmit={'Sure?'} use:enhance contents>
						<input type="hidden" name="area-id" bind:value={selectedAreaId} />

						<button type="submit">Delete</button>
					</form>
				</li>
			</ul>

			<button type="button" class="outlined" onclick={() => (selectedAreaId = null)}>Close</button>
		</article>
	</dialog>
{/if}

<BaseMap {onViewChange}>
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
		{#if isDrawing}
			{#each displayedTiles as tile (tile.id)}
				{@const coordinates = [
					[tile.minX, tile.maxY],
					[tile.maxX, tile.maxY],
					[tile.maxX, tile.minY],
					[tile.minX, tile.minY]
				]}

				<Polygon color="blue" width={2} coords={coordinates} />
			{/each}
		{/if}

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

			<Polygon
				color="green"
				width={2}
				coords={coordinates}
				fill="#60a5fa4a"
				onclick={() => (selectedAreaId = area.id)}
			/>

			{#each area.lidarJobs as { id, tile } (id)}
				{@const tileCoordinates = [
					[tile.minX, tile.maxY],
					[tile.maxX, tile.maxY],
					[tile.maxX, tile.minY],
					[tile.minX, tile.minY]
				]}

				<Polygon color="gray" width={2} coords={tileCoordinates} fill="#60a5fa4a" />
			{/each}
		{/each}
	</VectorLayer>

	{#each data.areas as area (area.id)}
		{#each area.lidarJobs as { id, tile } (id)}
			{#if tile.mapRenderingStepStatus === 'finished'}
				{@const extent = [tile.minX, tile.minY, tile.maxX, tile.maxY]}

				<StaticImage {extent} url="/api/map-generation/render-steps/{tile.id}" zIndex={2} />
			{/if}
		{/each}
	{/each}
</BaseMap>

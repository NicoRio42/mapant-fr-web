<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { confirmSubmit } from '$lib/actions/confirm-submit.js';
	import BaseMap from '$lib/components/map/BaseMap.svelte';
	import DrawBox from '$lib/components/map/DrawBox.svelte';
	import Polygon from '$lib/components/map/Polygon.svelte';
	import StaticImage from '$lib/components/map/StaticImage.svelte';
	import VectorLayer from '$lib/components/map/VectorLayer.svelte';
	import type { Tile } from '$lib/server/schema.js';
	import type { Extent } from 'ol/extent.js';
	import { tick } from 'svelte';

	let { data } = $props();

	let isDrawing = $state(false);
	let minX: number | null = $state(null);
	let maxX: number | null = $state(null);
	let minY: number | null = $state(null);
	let maxY: number | null = $state(null);
	let submitButton: HTMLButtonElement | undefined = $state();
	let selectedAreaId: null | string = $state(null);
	let selectedTileId: null | string = $state(null);
	let displayedTiles: Tile[] = $state([]);

	async function onViewChange({ zoom, extent }: { zoom: number; extent: Extent }) {
		if (zoom < 13) {
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

	let tilesInArea = $derived(data.areas.flatMap((a) => a.lidarJobs.map((j) => j.tileId)));
</script>

<form hidden action="?/add" method="post" use:enhance>
	<input type="hidden" name="minX" bind:value={minX} />
	<input type="hidden" name="maxX" bind:value={maxX} />
	<input type="hidden" name="minY" bind:value={minY} />
	<input type="hidden" name="maxY" bind:value={maxY} />
	<button type="submit" bind:this={submitButton}>Submit</button>
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

				<li>
					<form
						action="?/rerunLidarStepForWholeArea"
						method="post"
						use:confirmSubmit={'Sure?'}
						use:enhance
						contents
					>
						<input type="hidden" name="area-id" bind:value={selectedAreaId} />

						<button type="submit">Rerun lidar step</button>
					</form>
				</li>

				<li>
					<form
						action="?/rerunTileRenderingForWholeArea"
						method="post"
						use:confirmSubmit={'Sure?'}
						use:enhance
						contents
					>
						<input type="hidden" name="area-id" bind:value={selectedAreaId} />

						<button type="submit">Rerun render step</button>
					</form>
				</li>

				<li>
					<form action="?/merge" method="post" use:confirmSubmit={'Sure?'} use:enhance contents>
						<input type="hidden" name="area-id" bind:value={selectedAreaId} />

						<button type="submit">Merge</button>
					</form>
				</li>
			</ul>

			<button type="button" class="outlined" onclick={() => (selectedAreaId = null)}>Close</button>
		</article>
	</dialog>
{/if}

{#if selectedTileId !== null}
	{@const selectedTile = data.areas
		.flatMap((a) => a.lidarJobs.map((j) => j.tile))
		.find((t) => t.id === selectedTileId)}

	{#if selectedTile !== undefined}
		<dialog open>
			<article>
				<header>
					<h2>Tile: {selectedTile.id}</h2>
				</header>

				<ul>
					{#if selectedTile.lidarStepStatus === 'finished'}
						<li>
							<a
								href="/admin/areas/tiles/{selectedTile.id}/lidar"
								download="{selectedTile.id}.rasters.tar.xz">Rasters from LiDAR step</a
							>
						</li>
					{/if}

					{#if selectedTile.mapRenderingStepStatus === 'finished'}
						<li>
							<a
								href="/admin/areas/tiles/{selectedTile.id}/rasters"
								download="{selectedTile.id}.rasters.tar.xz">Rasters</a
							>
						</li>

						<li>
							<a
								href="/admin/areas/tiles/{selectedTile.id}/shapefiles"
								download="{selectedTile.id}.shapefiles.tar.xz">Shapefiles</a
							>
						</li>

						<li>
							<a
								href="/admin/areas/tiles/{selectedTile.id}/pngs"
								download="{selectedTile.id}.pngs.tar.xz">Pngs</a
							>
						</li>

						<li>
							<a
								href="/admin/areas/tiles/{selectedTile.id}/full-map"
								download="{selectedTile.id}.full-map.png">Full map</a
							>
						</li>
					{/if}

					<li>
						<form
							action="?/rerunTileLidarStep"
							method="post"
							use:confirmSubmit={'Sure?'}
							use:enhance
							contents
						>
							<input type="hidden" name="tile-id" bind:value={selectedTileId} />

							<button type="submit">Rerun lidar step</button>
						</form>
					</li>

					<li>
						<form
							action="?/rerunTileRendering"
							method="post"
							use:confirmSubmit={'Sure?'}
							use:enhance
							contents
						>
							<input type="hidden" name="tile-id" bind:value={selectedTileId} />

							<button type="submit">Rerun render step</button>
						</form>
					</li>
				</ul>

				<button type="button" class="outlined" onclick={() => (selectedTileId = null)}>Close</button
				>
			</article>
		</dialog>
	{/if}
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
		type="button"
		aria-label="Draw"
		onclick={() => (isDrawing = !isDrawing)}
	>
		<i i-carbon-edit w-5 h-5 block></i>
	</button>

	<button
		absolute
		top-22
		right-2
		flex
		items-center
		justify-center
		w-8
		h-8
		p-0
		bg-white
		class="outline"
		type="button"
		aria-label="Refresh"
		onclick={async () => await invalidateAll()}
	>
		<i i-carbon-update-now w-5 h-5 block></i>
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
		{#each displayedTiles as tile (tile.id)}
			{#if !tilesInArea.includes(tile.id)}
				{@const coordinates = [
					[tile.minX, tile.maxY],
					[tile.maxX, tile.maxY],
					[tile.maxX, tile.minY],
					[tile.minX, tile.minY]
				]}

				<Polygon color="blue" width={2} coords={coordinates} text={`Id: ${tile.id}`} />
			{/if}
		{/each}
	</VectorLayer>

	<VectorLayer zIndex={5}>
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
			{#each area.lidarJobs as { id, tile } (id)}
				{@const tileCoordinates = [
					[tile.minX, tile.maxY],
					[tile.maxX, tile.maxY],
					[tile.maxX, tile.minY],
					[tile.minX, tile.minY]
				]}

				<Polygon
					color={tile.mapRenderingStepStatus === 'finished'
						? 'red'
						: tile.mapRenderingStepStatus === 'ongoing'
							? 'orange'
							: tile.lidarStepStatus === 'finished'
								? 'yellow'
								: tile.lidarStepStatus === 'ongoing'
									? 'pink'
									: 'gray'}
					width={2}
					coords={tileCoordinates}
					onclick={() => (selectedTileId = tile.id)}
					fill="transparent"
					text={`Id: ${tile.id} \n Lidar: ${tile.lidarStepStatus} \n Render: ${tile.mapRenderingStepStatus}`}
				/>
			{/each}
		{/each}
	</VectorLayer>

	<VectorLayer zIndex={4}>
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
				onclick={() => (selectedAreaId = area.id)}
				fill="transparent"
			/>
		{/each}
	</VectorLayer>

	{#each displayedTiles as tile (tile.id)}
		{#if tile.mapRenderingStepStatus === 'finished'}
			{@const extent = [tile.minX, tile.minY, tile.maxX, tile.maxY]}

			<StaticImage {extent} url="/api/map-generation/render-steps/{tile.id}/full-map" zIndex={2} />
		{/if}
	{/each}
</BaseMap>

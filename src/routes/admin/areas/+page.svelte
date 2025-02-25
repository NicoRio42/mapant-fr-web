<script lang="ts">
	import { enhance } from '$app/forms';
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
	let displayedTiles: (Tile & { lidarJob: { id: string } | null })[] = $state([]);

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
</script>

<form hidden action="?/addArea" method="post" use:enhance>
	<input type="hidden" name="minX" bind:value={minX} />
	<input type="hidden" name="maxX" bind:value={maxX} />
	<input type="hidden" name="minY" bind:value={minY} />
	<input type="hidden" name="maxY" bind:value={maxY} />
	<button type="submit" bind:this={submitButton}>Submit</button>
</form>

{#snippet simpleForm({
	action,
	name,
	value,
	text
}: {
	action: string;
	name: string;
	value: string;
	text: string;
})}
	<form action="?/{action}" method="post" use:confirmSubmit={'Sure?'} use:enhance contents>
		<input type="hidden" {name} {value} />

		<button type="submit">{text}</button>
	</form>
{/snippet}

{#if selectedAreaId !== null || selectedTileId !== null}
	<dialog open>
		<article>
			{#if selectedAreaId !== null}
				<h2>Selected area</h2>

				<ul>
					<li>
						{@render simpleForm({
							action: 'deleteArea',
							name: 'area-id',
							value: selectedAreaId,
							text: 'Delete DANGER'
						})}
					</li>

					<li>
						{@render simpleForm({
							action: 'rerunAreasLidarStepJobs',
							name: 'area-id',
							value: selectedAreaId,
							text: 'Rerun lidar step DANGER'
						})}
					</li>

					<li>
						{@render simpleForm({
							action: 'rerunAreasRenderStepJobs',
							name: 'area-id',
							value: selectedAreaId,
							text: 'Rerun render step DANGER'
						})}
					</li>

					<li>
						{@render simpleForm({
							action: 'rerunAreasPyramidStepJobs',
							name: 'area-id',
							value: selectedAreaId,
							text: 'Rerun pyramid step DANGER'
						})}
					</li>

					<li>
						{@render simpleForm({
							action: 'invalidateAreasOngoingLidarJobs',
							name: 'area-id',
							value: selectedAreaId,
							text: 'Invalidate ongoing lidar jobs'
						})}
					</li>

					<li>
						{@render simpleForm({
							action: 'invalidateAreasOngoingRenderJobs',
							name: 'area-id',
							value: selectedAreaId,
							text: 'Invalidate ongoing render jobs'
						})}
					</li>

					<li>
						{@render simpleForm({
							action: 'invalidateAreasOngoingPyramidJobs',
							name: 'area-id',
							value: selectedAreaId,
							text: 'Invalidate ongoing pyramid jobs'
						})}
					</li>

					<li>
						{@render simpleForm({
							action: 'mergeArea',
							name: 'area-id',
							value: selectedAreaId,
							text: 'Merge'
						})}
					</li>
				</ul>
			{/if}

			{#if selectedAreaId !== null && selectedTileId !== null}
				<hr />
			{/if}

			{#if selectedTileId !== null}
				{@const selectedTile = displayedTiles.find((t) => t.id === selectedTileId)}

				{#if selectedTile !== undefined}
					<h2>Tile: {selectedTile.id}</h2>

					<ul>
						{#if selectedTile.lidarStepStatus === 'finished'}
							<li>
								<a
									href="/admin/areas/tiles/{selectedTile.id}/rasters"
									download="{selectedTile.id}.rasters.tar.xz">Rasters</a
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
							{@render simpleForm({
								action: 'rerunTileLidarStep',
								name: 'tile-id',
								value: selectedTileId,
								text: 'Rerun lidar step'
							})}
						</li>

						<li>
							{@render simpleForm({
								action: 'rerunTileRendering',
								name: 'tile-id',
								value: selectedTileId,
								text: 'Rerun render step'
							})}
						</li>

						<li>
							{@render simpleForm({
								action: 'rerunTilePyramidGeneration',
								name: 'tile-id',
								value: selectedTileId,
								text: 'Rerun pyramid generation'
							})}
						</li>
					</ul>
				{/if}
			{/if}

			<button
				type="button"
				class="outlined"
				onclick={() => {
					selectedAreaId = null;
					selectedTileId = null;
				}}>Close</button
			>
		</article>
	</dialog>
{/if}

<BaseMap {onViewChange} persistMapState>
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

	<VectorLayer zIndex={5}>
		{#each data.contributions as { contribution, user } (contribution.id)}
			{@const coordinates = [
				[contribution.minX, contribution.maxY],
				[contribution.maxX, contribution.maxY],
				[contribution.maxX, contribution.minY],
				[contribution.minX, contribution.minY]
			]}

			<Polygon
				color="blue"
				width={2}
				coords={coordinates}
				fill="transparent"
				text={user?.email ?? undefined}
			/>
		{/each}

		{#each displayedTiles as tile (`${tile.id}_${tile.mapRenderingStepStatus}_${tile.lidarStepStatus}_${tile.lidarJob !== null ? 'true' : 'false'}`)}
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
								: tile.lidarJob !== null
									? 'gray'
									: 'blue'}
				width={2}
				coords={tileCoordinates}
				onclick={() => (selectedTileId = tile.id)}
				fill="transparent"
				text={`Id: ${tile.id} \n Lidar: ${tile.lidarStepStatus} \n Render: ${tile.mapRenderingStepStatus}`}
			/>
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

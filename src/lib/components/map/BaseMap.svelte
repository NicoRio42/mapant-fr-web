<script lang="ts">
	import { clickOutside } from '#lib/actions/click-outside.js';
	import Mapant from '#lib/components/map/Mapant.svelte';
	import OLMap from '#lib/components/map/OLMap.svelte';
	import type { Extent } from 'ol/extent';
	import { fade } from 'svelte/transition';
	import LayerControlItem from './LayerControlItem.svelte';
	import Scan25IgnWebMercator from './Scan25IgnWebMercator.svelte';
	import type { Coordinate } from 'ol/coordinate';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import AzimutNord from './AzimutNord.svelte';

	let showLayerDropDown = $state(false);
	let showAttributions = $state(false);
	let isIgnScan25LayerDisplayed = $state(true);
	let isMapantLayerDisplayed = $state(true);

	interface Props {
		center?: Coordinate;
		zoom?: number;
		fit?: Extent;
		onViewChange?: (params: {
			zoom: number;
			extent: Extent;
			center: Coordinate;
			rotation: number;
		}) => void;
		children?: import('svelte').Snippet;
		class?: string;
		persistMapState?: boolean;
	}

	let {
		center,
		zoom = 6,
		fit,
		onViewChange,
		children,
		class: classList,
		persistMapState = false
	}: Props = $props();

	let ignScan25LayerOpacity = $state(0.25);
	let mapantLayerOpacity = $state(1);
	let rotation = $state(0);

	function onViewChangeCombined(params: {
		zoom: number;
		extent: Extent;
		center: Coordinate;
		rotation: number;
	}) {
		onViewChange?.(params);
		if (!persistMapState) return;

		localStorage.setItem(
			'mapState',
			`${params.zoom}|${params.center[0]}|${params.center[1]}|${params.rotation}`
		);
	}

	onMount(() => {
		if (!persistMapState) return;
		let mapState = localStorage.getItem('mapState');
		if (mapState === null) return;

		const [zoomLocalStorage, centerLatLocalStorage, centerLonLocalStorage, rotationLocalStorage] =
			mapState.split('|').map((s) => parseFloat(s));

		center = [centerLatLocalStorage, centerLonLocalStorage];
		zoom = zoomLocalStorage;
		rotation = rotationLocalStorage;
	});
</script>

<main grow relative bg-white class={classList}>
	<OLMap {center} {fit} {zoom} {rotation} onViewChange={onViewChangeCombined}>
		<Scan25IgnWebMercator visible={isIgnScan25LayerDisplayed} opacity={ignScan25LayerOpacity} />

		<Mapant visible={isMapantLayerDisplayed} opacity={mapantLayerOpacity} />

		{#if page.url.searchParams.has('azimut-nord')}
			<AzimutNord />
		{/if}

		{@render children?.()}
	</OLMap>

	<div
		absolute
		top-2
		right-2
		flex="~ col"
		items-end
		gap-2
		use:clickOutside={() => (showLayerDropDown = false)}
	>
		<button
			flex
			items-center
			justify-center
			w-8
			h-8
			p-0
			bg-white
			aria-label="Layers"
			class="outline"
			onclick={() => (showLayerDropDown = !showLayerDropDown)}
			><i i-carbon-layers w-5 h-5 block></i></button
		>

		{#if showLayerDropDown}
			<ul p-4 m-0 rounded shadow-2xl bg-background-color transition:fade={{ duration: 125 }}>
				<LayerControlItem
					label="IGN Scan25"
					bind:displayed={isIgnScan25LayerDisplayed}
					bind:opacity={ignScan25LayerOpacity}
				/>

				<LayerControlItem
					label="Mapant.fr"
					bind:displayed={isMapantLayerDisplayed}
					bind:opacity={mapantLayerOpacity}
				/>
			</ul>
		{/if}
	</div>

	<div class="attribution-control" use:clickOutside={() => (showAttributions = false)}>
		{#if showAttributions}
			<div class="attribution-panel" transition:fade={{ duration: 125 }}>
				<p>Sources de la carte</p>
				<ul>
					{#if isMapantLayerDisplayed && mapantLayerOpacity > 0}
						<li>
							© <a
								href="https://www.openstreetmap.org/copyright"
								target="_blank"
								rel="noopener noreferrer">OpenStreetMap contributors</a
							>
						</li>
					{/if}
					{#if isIgnScan25LayerDisplayed && ignScan25LayerOpacity > 0}
						<li>
							SCAN 25 : © <a href="https://www.ign.fr/" target="_blank" rel="noopener noreferrer"
								>IGN</a
							>
						</li>
					{/if}
					{#if isMapantLayerDisplayed && mapantLayerOpacity > 0}
						<li>
							LiDAR HD : © <a href="https://www.ign.fr/" target="_blank" rel="noopener noreferrer"
								>IGN</a
							>
						</li>
					{/if}
					{#if (!isMapantLayerDisplayed || mapantLayerOpacity === 0) && (!isIgnScan25LayerDisplayed || ignScan25LayerOpacity === 0)}
						<li>Aucune couche affichée</li>
					{/if}
				</ul>
			</div>
		{/if}

		<button
			type="button"
			class="outline attribution-button"
			aria-label="Attributions de la carte"
			aria-expanded={showAttributions}
			onclick={() => (showAttributions = !showAttributions)}>© Sources</button
		>
	</div>
</main>

<style>
	.attribution-control {
		position: absolute;
		right: 0.5rem;
		bottom: 0.5rem;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.attribution-button {
		margin: 0;
		background: white;
	}

	.attribution-panel {
		max-width: min(18rem, calc(100vw - 1rem));
		padding: 0.75rem 1rem;
		border-radius: var(--pico-border-radius);
		background: var(--pico-background-color);
		box-shadow: 0 4px 16px rgb(0 0 0 / 20%);
	}

	.attribution-panel p {
		margin-bottom: 0.5rem;
		font-weight: bold;
	}

	.attribution-panel ul {
		margin: 0;
		padding-left: 1.25rem;
	}

	.attribution-panel li {
		margin: 0;
	}
</style>

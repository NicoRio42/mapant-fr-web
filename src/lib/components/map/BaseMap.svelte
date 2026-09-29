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
</main>

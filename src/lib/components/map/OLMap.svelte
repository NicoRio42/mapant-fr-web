<script lang="ts">
	import { run } from 'svelte/legacy';

	import { browser } from '$app/environment';
	import { FRANCE_CENTER } from '$lib/constants';
	import { Map, View } from 'ol';
	import { defaults as defaultControls } from 'ol/control/defaults.js';
	import type { Extent } from 'ol/extent';
	import type { SimpleGeometry } from 'ol/geom';
	import { DblClickDragZoom, defaults as defaultInteractions } from 'ol/interaction.js';
	import { transform } from 'ol/proj.js';
	import { register } from 'ol/proj/proj4.js';
	import proj4 from 'proj4';
	import { onDestroy, onMount, setContext } from 'svelte';

	interface Props {
		center?: any;
		zoom?: number;
		fit?: SimpleGeometry | Extent | undefined;
		map?: Map | undefined;
		children?: import('svelte').Snippet;
	}

	let {
		center = $bindable(FRANCE_CENTER),
		zoom = 6,
		fit = undefined,
		map = $bindable(undefined),
		children
	}: Props = $props();

	let view: View = $state();

	run(() => {
		if (browser && view !== undefined && fit !== undefined)
			view.fit(fit, { padding: [20, 20, 20, 20] });
	});

	setContext('map', () => map);

	onMount(() => {
		setupLambert93Projection();

		view = new View({
			projection: 'EPSG:2154',
			center: transform(center, 'EPSG:4326', 'EPSG:2154'),
			zoom
		});

		map = new Map({
			target: 'mapviewer',
			interactions: defaultInteractions({ doubleClickZoom: true }).extend([
				new DblClickDragZoom({ delta: -0.01 })
			]),
			view,
			controls: defaultControls({ rotate: true, rotateOptions: { autoHide: false } })
		});

		map.on('moveend', (event) => {
			const newCenter = event.map.getView().getCenter();
			if (newCenter !== undefined) center = newCenter;
		});
	});

	function setupLambert93Projection() {
		proj4.defs(
			'EPSG:2154',
			'+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
		);

		proj4.defs(
			'IGNF:LAMB93',
			'+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
		);

		register(proj4);
	}

	onDestroy(() => {
		if (map !== undefined) map.dispose();
	});
</script>

<div id="mapviewer" class="map"></div>

{#if map}
	{@render children?.()}
{/if}

<style>
	#mapviewer {
		width: 100%;
		height: 100%;
	}

	:global(.ol-control) {
		position: absolute;
	}

	:global(.ol-control button),
	:global(.ol-control button:hover),
	:global(.ol-control button:focus) {
		--pico-background-color: white;
		--pico-color: var(--pico-primary-hover);
		--pico-border-color: var(--pico-primary-hover);
	}

	:global(.ol-control button) {
		margin: 0;
		font-size: 1.5rem;
		padding: 0.25rem;
		line-height: 1.5rem;
		display: flex;
		width: 2rem;
		height: 2rem;
		justify-content: center;
		align-items: center;
	}

	:global(.ol-zoom) {
		top: 0.5rem;
		left: 0.5rem;
		display: flex;
		flex-direction: column;
	}

	:global(.ol-zoom .ol-zoom-in) {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		border-bottom-width: 0;
	}

	:global(.ol-zoom .ol-zoom-out) {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}

	:global(.ol-rotate) {
		top: 5.75rem;
		left: 0.5rem;
	}

	:global(.ol-compass) {
		content: '';
		width: 1.5rem;
		height: 1.5rem;
		mask: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNNTAuMDMgNWEyLjUxNiAyLjUxNiAwIDAgMC0yLjQzIDEuNzZMMzQuNDkzIDQ4LjU0OGEyLjUxIDIuNTEgMCAwIDAtLjM3MiAxLjQ1NGMtLjAyNi41MS4xMDQgMS4wMTcuMzcyIDEuNDUybDEzLjEwNSA0MS43ODJjLjczNyAyLjM1MiA0LjA2NSAyLjM1MiA0LjgwMiAwbDEzLjEwNS00MS43ODVjLjI3LS40MzYuMzk5LS45NDUuMzcyLTEuNDU2YTIuNTEzIDIuNTEzIDAgMCAwLS4zNzItMS40NUw1Mi40MDEgNi43NkEyLjUxMyAyLjUxMyAwIDAgMCA1MC4wMyA1TTM5LjQwMyA1MC4yODhoNi4yMDVjLjE1MiAyLjMwNiAyLjA0OCA0LjEzNCA0LjM5MiA0LjEzNGMyLjM0NCAwIDQuMjQtMS44MjggNC4zOTItNC4xMzRoNi40NjFMNTAgODQuMDc4WiIgY29sb3I9ImN1cnJlbnRDb2xvciIvPjwvc3ZnPg==)
			no-repeat;
		mask-position: center;
		mask-size: 100% 100%;
		background-color: currentColor;
		will-change: transform;
	}

	/* Attribution */
	:global(.ol-attribution) {
		position: absolute;
		text-align: right;
		bottom: 0.5em;
		right: 0.5em;
		max-width: calc(100% - 1.3em);
		display: flex;
		flex-flow: row-reverse;
		align-items: center;
	}

	:global(.ol-attribution a) {
		color: var(--ol-subtle-foreground-color);
		text-decoration: none;
	}

	:global(.ol-attribution ul) {
		margin: 0;
		padding: 1px 0.5em;
		color: var(--ol-foreground-color);
		text-shadow: 0 0 2px var(--ol-background-color);
		font-size: 12px;
	}

	:global(.ol-attribution li) {
		display: inline;
		list-style: none;
	}

	:global(.ol-attribution li:not(:last-child):after) {
		content: ' ';
	}

	:global(.ol-attribution img) {
		max-height: 2em;
		max-width: inherit;
		vertical-align: middle;
	}

	:global(.ol-attribution button) {
		flex-shrink: 0;
	}

	:global(.ol-attribution.ol-collapsed ul) {
		display: none;
	}

	:global(.ol-attribution:not(.ol-collapsed)) {
		background: var(--ol-partial-background-color);
	}

	:global(.ol-attribution.ol-uncollapsible) {
		bottom: 0;
		right: 0;
		border-radius: 4px 0 0;
	}

	:global(.ol-attribution.ol-uncollapsible img) {
		margin-top: -0.2em;
		max-height: 1.6em;
	}

	:global(.ol-attribution.ol-uncollapsible button) {
		display: none;
	}
</style>

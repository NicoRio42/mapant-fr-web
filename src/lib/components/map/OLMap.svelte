<script lang="ts">
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

	import 'ol/ol.css';

	export let center = FRANCE_CENTER;
	export let zoom = 6;
	export let fit: SimpleGeometry | Extent | undefined = undefined;
	export let map: Map | undefined = undefined;

	let view: View;

	$: if (browser && view !== undefined && fit !== undefined)
		view.fit(fit, { padding: [20, 20, 20, 20] });

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
			interactions: defaultInteractions({ doubleClickZoom: true }).extend([new DblClickDragZoom()]),
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
	<slot></slot>
{/if}

<style>
	#mapviewer {
		width: 100%;
		height: 100%;
	}

	:global(.ol-rotate) {
		right: initial;
		left: 0.5em;
		top: 4rem;
	}
</style>

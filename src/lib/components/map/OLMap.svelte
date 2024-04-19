<script lang="ts">
	import { Map, View } from 'ol';
	import 'ol/ol.css';
	import { onDestroy, onMount, setContext } from 'svelte';
	import { register } from 'ol/proj/proj4.js';
	import proj4 from 'proj4';
	import { transform } from 'ol/proj.js';
	import {
		DblClickDragZoom,
		defaults as defaultInteractions,
		DoubleClickZoom
	} from 'ol/interaction.js';

	let map: Map;

	setContext('map', () => map);

	onMount(() => {
		setupLambert93Projection();
		const center = transform([2.43028, 46.53972], 'EPSG:4326', 'EPSG:2154');
		// Webmercator EPSG:3857
		// Lambert93  EPSG:2154

		map = new Map({
			target: 'mapviewer',
			interactions: defaultInteractions().extend([new DblClickDragZoom(), new DoubleClickZoom()]),
			view: new View({
				projection: 'EPSG:2154',
				center,
				zoom: 6
			})
		});
	});

	function setupLambert93Projection() {
		proj4.defs(
			'EPSG:2154',
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
</style>
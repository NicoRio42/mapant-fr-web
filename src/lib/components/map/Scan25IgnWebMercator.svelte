<script lang="ts">
	import { browser } from '$app/environment';
	import type { Map } from 'ol';
	import WMTSCapabilities from 'ol/format/WMTSCapabilities.js';
	import TileLayer from 'ol/layer/Tile';
	import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS.js';
	import { getContext, onDestroy, onMount } from 'svelte';

	export let visible = true;
	export let opacity = 1;

	const getMap = getContext<() => Map>('map');
	let map: Map;
	let tileLayer: TileLayer<WMTS>;

	$: if (browser && tileLayer) tileLayer.setVisible(visible);
	$: if (browser && tileLayer) tileLayer.setOpacity(opacity);

	onMount(async () => {
		map = getMap();

		const parser = new WMTSCapabilities();

		tileLayer = new TileLayer({ zIndex: 0, visible, opacity });

		const geoportailLambert93MetaDataUrl =
			'https://data.geopf.fr/private/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities&apikey=ign_scan_ws';

		const response = await (await fetch(geoportailLambert93MetaDataUrl)).text();
		const result = parser.read(response);

		const options = optionsFromCapabilities(result, {
			layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR',
			matrixSet: 'EPSG:3857'
		});

		if (options === null) {
			throw new Error('Option object returned from optionsFromCapabilities is null');
		}

		options.crossOrigin = '';
		options.projection = 'EPSG:3857';
		options.wrapX = false;

		const wmts = new WMTS({
			...options,
			tileLoadFunction: (tile, src) => {
				// @ts-ignore
				tile.getImage().src = src + '&apikey=ign_scan_ws';
			},
			attributions: '© <a href="https://www.ign.fr/" target="_blank">IGN</a>'
		});

		tileLayer.setSource(wmts);

		map?.addLayer(tileLayer);
	});

	onDestroy(() => {
		if (map !== undefined && tileLayer !== undefined) map.removeLayer(tileLayer);
	});
</script>

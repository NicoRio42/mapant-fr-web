<script lang="ts">
	import type { Map } from 'ol';
	import WMTSCapabilities from 'ol/format/WMTSCapabilities.js';
	import TileLayer from 'ol/layer/Tile';
	import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS.js';
	import { getContext, onDestroy, onMount } from 'svelte';

	const getMap = getContext<() => Map>('map');
	let map: Map;
	let tileLayer: TileLayer<WMTS>;

	onMount(async () => {
		map = getMap();

		const parser = new WMTSCapabilities();

		tileLayer = new TileLayer({ opacity: 0.5 });

		const geoportailLambert93MetaDataUrl =
			'https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities';

		const response = await (await fetch(geoportailLambert93MetaDataUrl)).text();
		const result = parser.read(response);

		const options = optionsFromCapabilities(result, {
			layer: 'PCRS.LAMB93',
			matrixSet: 'LAMB93'
		});

		if (options === null) {
			throw new Error('Option object returned from optionsFromCapabilities is null');
		}

		options.crossOrigin = '';
		options.projection = 'EPSG:2154';
		options.wrapX = false;

		const wmts = new WMTS(options);
		tileLayer.setSource(wmts);

		console.log(wmts.tileGrid);
		map?.addLayer(tileLayer);
	});

	onDestroy(() => {
		if (map !== undefined && tileLayer !== undefined) map.removeLayer(tileLayer);
	});
</script>

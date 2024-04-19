<script lang="ts">
	import type { Feature, Map } from 'ol';
	import GeoJSON from 'ol/format/GeoJSON.js';
	import VectorLayer from 'ol/layer/Vector';
	import VectorSource from 'ol/source/Vector';
	import Fill from 'ol/style/Fill';
	import Stroke from 'ol/style/Stroke';
	import Style from 'ol/style/Style';
	import { getContext, onDestroy, onMount } from 'svelte';

	const getMap = getContext<() => Map>('map');
	let map: Map;
	let vectorLayer: VectorLayer<VectorSource>;

	onMount(async () => {
		map = getMap();

		const styles = {
			MultiPolygon: new Style({
				stroke: new Stroke({
					color: 'yellow',
					width: 1
				})
			})
		};

		const styleFunction = function (feature: Feature) {
			// @ts-ignore
			return styles[feature.getGeometry().getType()];
		};

		const lidarHdTiles = (await import('./lidar-hd.json')).default;

		const vectorSource = new VectorSource({
			features: new GeoJSON().readFeatures(lidarHdTiles)
		});

		vectorLayer = new VectorLayer({
			source: vectorSource,
			// @ts-ignore
			style: styleFunction
		});

		map?.addLayer(vectorLayer);
	});

	onDestroy(() => {
		if (map !== undefined && vectorLayer !== undefined) map.removeLayer(vectorLayer);
	});
</script>

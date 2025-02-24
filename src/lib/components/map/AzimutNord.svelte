<script lang="ts">
	import type { Feature, Map } from 'ol';
	import GeoJSON from 'ol/format/GeoJSON.js';
	import type { Geometry } from 'ol/geom';
	import VectorLayer from 'ol/layer/Vector';
	import VectorSource from 'ol/source/Vector';
	import Stroke from 'ol/style/Stroke';
	import Style from 'ol/style/Style';
	import { getContext, onDestroy, onMount } from 'svelte';

	const getMap = getContext<() => Map>('map');
	let map: Map | undefined = $state();
	let vectorLayer: VectorLayer<Feature<Geometry>> | undefined = $state();

	const style = new Style({
		stroke: new Stroke({
			color: 'blue',
			width: 4
		})
	});

	onMount(async () => {
		map = getMap();

		const styles = {
			MultiLineString: style
		};

		const styleFunction = function (feature: Feature) {
			// @ts-ignore
			return styles[feature.getGeometry().getType()];
		};

		const azimutNordLine = (await import('./azimut-nord.json')).default;

		// const lidarHdTiles = {
		// 	...lidarHdTilesFile,
		// 	features: lidarHdTilesFile.features.map((feature) => ({
		// 		...feature,
		// 		properties: { ...feature.properties, bbox: feature.bbox }
		// 	}))
		// };

		vectorLayer = new VectorLayer({
			source: new VectorSource({
				features: new GeoJSON().readFeatures(azimutNordLine),
				attributions: '© <a href="https://www.ign.fr/" target="_blank">IGN</a>'
			}),
			// @ts-ignore
			style: styleFunction,
			zIndex: 1
		});

		map?.addLayer(vectorLayer);
	});

	onDestroy(() => {
		if (map !== undefined && vectorLayer !== undefined) {
			map.removeLayer(vectorLayer);
		}
	});
</script>

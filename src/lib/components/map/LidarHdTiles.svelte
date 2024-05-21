<script lang="ts">
	import { browser } from '$app/environment';
	import type { Feature, Map, MapBrowserEvent } from 'ol';
	import GeoJSON from 'ol/format/GeoJSON.js';
	import VectorLayer from 'ol/layer/Vector';
	import VectorSource from 'ol/source/Vector';
	import Fill from 'ol/style/Fill';
	import Stroke from 'ol/style/Stroke';
	import Style from 'ol/style/Style';
	import { getContext, onDestroy, onMount } from 'svelte';

	export let visible = true;
	export let opacity = 1;
	export let allowSelection = false;
	export let selected: Feature | null = null;

	const getMap = getContext<() => Map>('map');
	let map: Map;
	let vectorLayer: VectorLayer<VectorSource>;

	$: if (browser && vectorLayer) vectorLayer.setVisible(visible);
	$: if (browser && vectorLayer) vectorLayer.setOpacity(opacity);

	const notSelectedStyle = new Style({
		stroke: new Stroke({
			color: '#f56b3d',
			width: 1
		}),
		// Feature should have a fill so the hover effect works
		fill: new Fill({ color: '#f56b3d36' })
	});

	const selectedStyle = new Style({
		stroke: new Stroke({
			color: '#f56b3d',

			width: 4
		}),
		fill: new Fill({ color: '#f56b3d78' })
	});

	let hovered: Feature | null = null;

	function mapPointermoveListener(e: MapBrowserEvent<any>) {
		if (hovered !== null) {
			if (hovered !== selected) hovered.setStyle(notSelectedStyle);
			hovered = null;
		}

		if (!e.dragging) {
			map.getTargetElement().style.cursor = map.hasFeatureAtPixel(
				map.getEventPixel(e.originalEvent),
				{ checkWrapped: true, layerFilter: (layer) => layer === vectorLayer }
			)
				? 'pointer'
				: '';
		}

		map.forEachFeatureAtPixel(
			e.pixel,
			function (f) {
				// @ts-ignore
				hovered = f;
				hovered?.setStyle(selectedStyle);
				return true;
			},
			{ checkWrapped: true, layerFilter: (layer) => layer === vectorLayer }
		);
	}

	function mapClickListener(e: MapBrowserEvent<any>) {
		if (selected !== null) {
			selected.setStyle(notSelectedStyle);
			selected = null;
		}

		map.forEachFeatureAtPixel(
			e.pixel,
			function (f) {
				// @ts-ignore
				selected = f;
				selected?.setStyle(selectedStyle);
				return true;
			},
			{ checkWrapped: true, layerFilter: (layer) => layer === vectorLayer }
		);
	}

	$: {
		if (browser && allowSelection) {
			map?.on('click', mapClickListener);
			map?.on('pointermove', mapPointermoveListener);
		} else if (!allowSelection) {
			map?.un('pointermove', mapPointermoveListener);
			map?.un('click', mapClickListener);
			hovered?.setStyle(notSelectedStyle);
			selected?.setStyle(notSelectedStyle);
			hovered = null;
			selected = null;
		}
	}

	onMount(async () => {
		map = getMap();

		const styles = {
			MultiPolygon: notSelectedStyle
		};

		const styleFunction = function (feature: Feature) {
			// @ts-ignore
			return styles[feature.getGeometry().getType()];
		};

		const lidarHdTilesFile = (await import('./lidar-hd.json')).default;

		const lidarHdTiles = {
			...lidarHdTilesFile,
			features: lidarHdTilesFile.features.map((feature) => ({
				...feature,
				properties: { ...feature.properties, bbox: feature.bbox }
			}))
		};

		vectorLayer = new VectorLayer({
			source: new VectorSource({
				features: new GeoJSON().readFeatures(lidarHdTiles)
			}),
			// @ts-ignore
			style: styleFunction,
			zIndex: 1,
			visible,
			opacity
		});

		if (allowSelection) {
			map.on('click', mapClickListener);
			map.on('pointermove', mapPointermoveListener);
		}

		map?.addLayer(vectorLayer);
	});

	onDestroy(() => {
		if (map !== undefined && vectorLayer !== undefined) {
			map.removeLayer(vectorLayer);
			map.un('pointermove', mapPointermoveListener);
			map.un('click', mapClickListener);
		}
	});
</script>

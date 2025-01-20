<script lang="ts">
	import { Feature, Map, MapBrowserEvent } from 'ol';
	import type { Coordinate } from 'ol/coordinate.js';
	import type { Geometry } from 'ol/geom.js';
	import { Polygon } from 'ol/geom.js';
	import type VectorLayer from 'ol/layer/Vector.js';
	import Fill from 'ol/style/Fill.js';
	import Stroke from 'ol/style/Stroke.js';
	import Style, { type Options as StyleOptions } from 'ol/style/Style.js';
	import Text from 'ol/style/Text.js';
	import { getContext, onDestroy, onMount } from 'svelte';

	interface Props {
		color: string;
		fill?: string | undefined;
		coords: Coordinate[];
		width: number;
		text?: string | undefined;
		onclick?: () => void;
	}

	let { color, fill = undefined, coords, width, text = undefined, onclick }: Props = $props();

	let vectorLayer: VectorLayer<Feature<Geometry>>, map: Map;
	let feature: Feature;
	let polygon: Polygon | undefined = $state();

	$effect(() => {
		if (polygon !== undefined) polygon.setCoordinates([coords]);
	});

	const getVectorLayer = getContext<() => VectorLayer<Feature<Geometry>>>('vectorLayer');
	const getMap = getContext<() => Map>('map');

	const clickCallback = (event: MapBrowserEvent<any>) => {
		map.forEachFeatureAtPixel(event.pixel, (clickedFeature, layer) => {
			if (clickedFeature === feature && onclick) onclick();
		});
	};

	onMount(() => {
		map = getMap();
		vectorLayer = getVectorLayer();
		const vectorSource = vectorLayer.getSource();

		polygon = new Polygon([coords]);
		feature = new Feature(polygon);

		const stroke = new Stroke({ color, width });
		const styleOptions: StyleOptions = { stroke };

		if (text !== undefined) {
			const font = 'bold 1.25rem/1 Arial';

			const textStyle = new Text({
				font,
				text,
				fill: new Fill({ color }),
				stroke: new Stroke({ color: '#ffffff', width: 3 }),
				textAlign: 'start',
				offsetX: 10
			});

			styleOptions.text = textStyle;
		}

		if (fill !== undefined) {
			styleOptions.fill = new Fill({ color: fill });
		}

		const style = new Style(styleOptions);
		feature.setStyle(style);

		vectorSource?.addFeature(feature);

		if (onclick) map?.on('click', clickCallback);
	});

	onDestroy(() => {
		if (feature !== undefined) vectorLayer?.getSource()?.removeFeature(feature);
		if (onclick) map?.un('click', clickCallback);
	});
</script>

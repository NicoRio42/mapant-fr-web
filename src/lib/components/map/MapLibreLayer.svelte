<script lang="ts">
	import maplibre from 'maplibre-gl';
	import type { Map } from 'ol';
	import Layer from 'ol/layer/Layer';
	import { toLonLat } from 'ol/proj';
	import { Source } from 'ol/source';
	import { getContext, onDestroy, onMount } from 'svelte';

	const getMap = getContext<() => Map>('map');
	let map: Map;
	let mbLayer: Layer;

	onMount(async () => {
		map = getMap();

		// const center = [-98.8, 37.9];
		const key = 'O7CwpMdQlEMpPJOfXCH8';

		const mbMap = new maplibre.Map({
			style: 'https://api.maptiler.com/maps/outdoor-v2/style.json?key=' + key,
			attributionControl: false,
			boxZoom: false,
			// center: center,
			container: 'mapviewer',
			doubleClickZoom: false,
			dragPan: false,
			dragRotate: false,
			interactive: false,
			keyboard: false,
			pitchWithRotate: false,
			scrollZoom: false,
			touchZoomRotate: false
		});

		mbLayer = new Layer({
			render: function (frameState) {
				const canvas = mbMap.getCanvas();
				const viewState = frameState.viewState;

				console.log(viewState);

				const visible = mbLayer.getVisible();
				canvas.style.display = visible ? 'block' : 'none';
				canvas.style.position = 'absolute';

				const opacity = mbLayer.getOpacity();
				canvas.style.opacity = String(opacity);

				// adjust view parameters in mapbox
				const rotation = viewState.rotation;
				mbMap.jumpTo({
					center: toLonLat(viewState.center, viewState.projection),
					zoom: viewState.zoom - 1,
					bearing: (-rotation * 180) / Math.PI,
					animate: false
				});

				// cancel the scheduled update & trigger synchronous redraw
				// see https://github.com/mapbox/mapbox-gl-js/issues/7893#issue-408992184
				// NOTE: THIS MIGHT BREAK IF UPDATING THE MAPBOX VERSION
				if (mbMap._frame) {
					mbMap._frame.cancel();
					mbMap._frame = null;
				}
				mbMap._render();

				return canvas;
			},
			source: new Source({
				attributions: [
					'<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a>',
					'<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>'
				],
				projection: 'EPSG:3857'
			})
		});

		map?.addLayer(mbLayer);
	});

	onDestroy(() => {
		if (map !== undefined && mbLayer !== undefined) map.removeLayer(mbLayer);
	});
</script>

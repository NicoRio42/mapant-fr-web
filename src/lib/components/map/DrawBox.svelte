<script lang="ts">
	import type { Map } from 'ol';
	import Draw, { type DrawEvent, createBox } from 'ol/interaction/Draw.js';
	import { getContext, onDestroy, onMount } from 'svelte';

	let { ondrawend }: { ondrawend: (drawEnd: DrawEvent) => void } = $props();

	let draw: Draw, map: Map;
	const getMap = getContext<() => Map>('map');

	function escapeCallback(event: KeyboardEvent) {
		if (event.code === 'Escape' && draw !== undefined) draw.abortDrawing();
	}

	onMount(() => {
		map = getMap();

		draw = new Draw({
			type: 'Circle',
			geometryFunction: createBox()
		});

		draw.on('drawend', (e) => ondrawend(e));
		map.addInteraction(draw);

		document.addEventListener('keydown', escapeCallback);
	});

	onDestroy(() => {
		if (map !== undefined && draw !== undefined) map.removeInteraction(draw);
		document.removeEventListener('keydown', escapeCallback);
	});
</script>

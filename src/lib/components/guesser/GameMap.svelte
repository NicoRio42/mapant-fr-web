<script lang="ts">
	import { Map, View, Feature } from 'ol';
	import { defaults as defaultControls } from 'ol/control/defaults.js';
	import type { Coordinate } from 'ol/coordinate.js';
	import { Point, LineString } from 'ol/geom.js';
	import { defaults as defaultInteractions } from 'ol/interaction/defaults.js';
	import TileLayer from 'ol/layer/Tile.js';
	import VectorLayer from 'ol/layer/Vector.js';
	import { fromLonLat, toLonLat, transform, transformExtent } from 'ol/proj.js';
	import OSM from 'ol/source/OSM.js';
	import VectorSource from 'ol/source/Vector.js';
	import { Circle, Fill, Stroke, Style, Text } from 'ol/style.js';
	import { onMount, setContext } from 'svelte';
	import Mapant from '../map/Mapant.svelte';
	import { START_RESOLUTION } from '#lib/guesser/round.js';
	import { explorationView } from '#lib/guesser/view.js';

	interface Props {
		mode: 'explore' | 'guess';
		target: Coordinate;
		guess?: Coordinate;
		revealed: boolean;
		resetSequence?: number;
		onGuess?: (point: Coordinate) => void;
	}

	let { mode, target, guess, revealed, resetSequence = 0, onGuess }: Props = $props();
	let container: HTMLDivElement;
	let map: Map | undefined = $state.raw();
	const markers = new VectorSource({ wrapX: false });
	let pendingFit = false;
	setContext('map', () => map);

	function marker(coordinate: Coordinate, label: string, color: string) {
		const feature = new Feature(new Point(coordinate));
		feature.setStyle(
			new Style({
				image: new Circle({
					radius: 8,
					fill: new Fill({ color }),
					stroke: new Stroke({ color: 'white', width: 3 })
				}),
				text: new Text({
					text: label,
					offsetY: -23,
					font: 'bold 14px sans-serif',
					fill: new Fill({ color }),
					stroke: new Stroke({ color: 'white', width: 4 })
				}),
				zIndex: 2
			})
		);
		return feature;
	}

	function fitMap() {
		if (!map || !pendingFit) return;
		const size = map.getSize();
		if (!size || size[0] < 150 || size[1] < 150) return;
		if (revealed && guess) {
			map.getView().fit(markers.getExtent(), {
				padding: [55, 55, 55, 55],
				minResolution: mode === 'explore' ? START_RESOLUTION : 4
			});
		} else if (mode === 'guess') {
			map.getView().fit(transformExtent([-5.2, 41.3, 9.7, 51.2], 'EPSG:4326', 'EPSG:3857'), {
				padding: [24, 24, 24, 24]
			});
		}
		pendingFit = false;
	}

	onMount(() => {
		const instance = new Map({
			target: container,
			view:
				mode === 'explore'
					? explorationView(target, revealed)
					: new View({
							projection: 'EPSG:3857',
							center: fromLonLat([2.5, 46.5]),
							zoom: 5,
							minZoom: 2,
							maxZoom: 19
						}),
			layers: [
				...(mode === 'guess' ? [new TileLayer({ source: new OSM({ wrapX: false }) })] : []),
				new VectorLayer({ source: markers, zIndex: 10 })
			],
			controls: defaultControls({ attributionOptions: { collapsible: false } }),
			// Accept the first drag even before the map receives keyboard focus.
			interactions: defaultInteractions({ keyboard: mode === 'explore' })
		});
		instance.on('singleclick', (event) => {
			if (mode === 'guess' && !revealed) onGuess?.(toLonLat(event.coordinate));
		});
		map = instance;
		pendingFit = true;
		const resizeObserver = new ResizeObserver(() => {
			instance.updateSize();
			fitMap();
		});
		resizeObserver.observe(container);
		return () => {
			resizeObserver.disconnect();
			instance.dispose();
		};
	});

	$effect(() => {
		if (!map) return;
		const projection = mode === 'explore' ? 'EPSG:2154' : 'EPSG:3857';
		const start = transform(target, 'EPSG:2154', projection);
		const chosen = guess ? fromLonLat(guess, projection) : undefined;
		markers.clear();
		if (mode === 'explore' || revealed) markers.addFeature(marker(start, 'Départ', '#b7410e'));
		if (chosen && (mode === 'guess' || revealed)) {
			markers.addFeature(marker(chosen, 'Votre choix', '#1565c0'));
		}
		if (revealed && chosen) {
			const line = new Feature(new LineString([start, chosen]));
			line.setStyle(
				new Style({ stroke: new Stroke({ color: '#343b44', width: 3, lineDash: [8, 8] }) })
			);
			markers.addFeature(line);
			if (mode === 'explore') map.getView().setMinZoom(0);
			pendingFit = true;
			fitMap();
		}
	});

	$effect(() => {
		if (!map || mode !== 'explore' || resetSequence === 0) return;
		map.getView().cancelAnimations();
		map
			.getView()
			.animate({ center: target, resolution: START_RESOLUTION, rotation: 0, duration: 250 });
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={container}
	class="game-map"
	class:choosing={mode === 'guess' && !revealed}
	role={mode === 'explore' ? 'application' : 'region'}
	aria-label={mode === 'explore'
		? 'Carte Mapant du lieu à retrouver'
		: 'Carte OpenStreetMap pour votre choix'}
	tabindex={mode === 'explore' ? 0 : undefined}
></div>

{#if map && mode === 'explore'}
	<Mapant />
{/if}

<style>
	.game-map {
		width: 100%;
		height: 100%;
		min-height: 220px;
		background: #f3f1eb;
	}
	.choosing {
		cursor: crosshair;
	}
	.game-map:focus-visible {
		outline: 3px solid var(--pico-primary);
		outline-offset: -3px;
	}
	/* Keep OpenLayers controls local: its global CSS overrides the main map controls. */
	.game-map :global(.ol-viewport),
	.game-map :global(.ol-unselectable) {
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	.game-map :global(.ol-viewport) {
		/* Let OpenLayers handle touch panning and pinching without browser takeover. */
		touch-action: none;
	}
	.game-map :global(.ol-viewport canvas) {
		all: unset;
		overflow: hidden;
	}
	.game-map :global(.ol-control) {
		position: absolute;
		border-radius: 4px;
	}
	.game-map :global(.ol-zoom) {
		top: 0.5rem;
		left: 0.5rem;
		display: flex;
		flex-direction: column;
	}
	.game-map :global(.ol-rotate) {
		top: 0.5rem;
		right: 0.5rem;
	}
	.game-map :global(.ol-hidden) {
		display: none;
	}
	.game-map :global(.ol-compass) {
		display: block;
	}
	.game-map :global(.ol-box) {
		border: 2px solid var(--pico-primary);
		background: rgb(255 255 255 / 30%);
	}
	.game-map :global(.ol-control button) {
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0;
		width: 2rem;
		height: 2rem;
		padding: 0;
		background: white;
		color: #343b44;
		border: 1px solid #d7d7d7;
		font-size: 1.25rem;
	}
	.game-map :global(.ol-attribution) {
		bottom: 0;
		right: 0;
		text-align: right;
		max-width: calc(100% - 1rem);
		font-size: 11px;
		background: rgb(255 255 255 / 90%);
	}
	.game-map :global(.ol-attribution ul) {
		margin: 0;
		padding: 2px 5px;
	}
	.game-map :global(.ol-attribution li) {
		display: inline;
		list-style: none;
	}
	.game-map :global(.ol-attribution li:not(:last-child)::after) {
		content: ' ';
	}
	.game-map :global(.ol-attribution a) {
		color: #343b44;
		text-decoration: none;
	}
	.game-map :global(.ol-attribution button) {
		display: none;
	}
</style>

<script lang="ts">
	import { Map, View, Feature } from 'ol';
	import Overlay from 'ol/Overlay.js';
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
	import { explorationStartResolution, explorationView } from '#lib/guesser/view.js';
	import { edgeIndicators, type EdgeIndicator } from '#lib/guesser/edge-indicator.js';

	interface Props {
		mode: 'explore' | 'guess';
		target: Coordinate;
		guess?: Coordinate;
		revealed: boolean;
		onGuess?: (point: Coordinate) => void;
	}

	let { mode, target, guess, revealed, onGuess }: Props = $props();
	let container: HTMLDivElement;
	let popupElement: HTMLDivElement;
	let map: Map | undefined = $state.raw();
	let popup: Overlay | undefined = $state.raw();
	let popupCoordinate: Coordinate | undefined = $state.raw();
	let checkpoints: Coordinate[] = $state.raw([]);
	let checkpointPositions: { coordinate: Coordinate; x: number; y: number; angle?: number }[] =
		$state.raw([]);
	let startIndicator: EdgeIndicator | null = $state.raw(null);
	let mobile = false;
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
		if (revealed) {
			map.getView().fit(markers.getExtent(), {
				padding: [55, 55, 55, 55],
				minResolution: mode === 'explore' ? explorationStartResolution(mobile) : 4
			});
		} else if (mode === 'guess') {
			map.getView().fit(transformExtent([-5.2, 41.3, 9.7, 51.2], 'EPSG:4326', 'EPSG:3857'), {
				padding: [24, 24, 24, 24]
			});
		}
		pendingFit = false;
	}

	function updateIndicators() {
		if (!map || (mode === 'guess' && !revealed)) {
			startIndicator = null;
			return;
		}
		const size = map.getSize();
		const start = transform(target, 'EPSG:2154', map.getView().getProjection());
		const pixel = map.getPixelFromCoordinate(start);
		if (!size || !pixel) {
			startIndicator = null;
			checkpointPositions = [];
			return;
		}
		const checkpointPixels = checkpoints.map((coordinate) =>
			map!.getPixelFromCoordinate(coordinate)
		);
		const indicators = edgeIndicators([pixel, ...checkpointPixels], size);
		startIndicator = indicators[0];
		checkpointPositions = checkpoints.map((coordinate, index) => {
			const [x, y] = checkpointPixels[index];
			return { coordinate, ...(indicators[index + 1] ?? { x, y }) };
		});
	}

	function flyTo(coordinate: Coordinate) {
		if (!map) return;
		closePopup();
		const view = map.getView();
		view.cancelAnimations();
		view.animate({
			center: coordinate,
			resolution: mode === 'explore' ? explorationStartResolution(mobile) : view.getResolution(),
			rotation: 0,
			duration: 250
		});
	}

	function returnToStart() {
		if (!map) return;
		flyTo(transform(target, 'EPSG:2154', map.getView().getProjection()));
	}

	function closePopup() {
		popupCoordinate = undefined;
		popup?.setPosition(undefined);
	}

	function addCheckpoint() {
		if (!map || !popupCoordinate) return;
		checkpoints = [...checkpoints, popupCoordinate.slice()];
		closePopup();
		container.focus({ preventScroll: true });
		map.render();
	}

	onMount(() => {
		const mobileViewport = window.matchMedia('(max-width: 600px)');
		mobile = mobileViewport.matches;
		const instance = new Map({
			target: container,
			view:
				mode === 'explore'
					? explorationView(target, revealed, mobile)
					: new View({
							projection: 'EPSG:3857',
							center: fromLonLat([2.5, 46.5]),
							zoom: 5,
							minZoom: 2
						}),
			layers: [
				...(mode === 'guess' ? [new TileLayer({ source: new OSM({ wrapX: false }) })] : []),
				new VectorLayer({ source: markers, zIndex: 10 })
			],
			controls: defaultControls({ zoom: false, attributionOptions: { collapsible: false } }),
			// Accept the first drag even before the map receives keyboard focus.
			interactions: defaultInteractions({ keyboard: mode === 'explore' })
		});
		if (mode === 'explore') {
			popup = new Overlay({
				element: popupElement,
				positioning: 'bottom-center',
				offset: [0, -12],
				stopEvent: true,
				autoPan: { animation: { duration: 250 }, margin: 16 }
			});
			instance.addOverlay(popup);
		}
		instance.on('singleclick', (event) => {
			if (mode === 'guess' && !revealed) onGuess?.(toLonLat(event.coordinate));
			if (mode === 'explore') popupCoordinate = event.coordinate.slice();
		});
		map = instance;
		// Update on every rendered frame, including drags, zooms and rotations.
		instance.on('postrender', updateIndicators);
		const updateMobileViewport = () => {
			mobile = mobileViewport.matches;
			if (mode === 'explore') {
				instance.getView().setMinZoom(revealed ? 0 : mobile ? 11 : 12);
			}
		};
		mobileViewport.addEventListener('change', updateMobileViewport);
		pendingFit = true;
		const resizeObserver = new ResizeObserver(() => {
			instance.updateSize();
			// The final summary shrinks the map after reveal; keep both markers in view.
			if (revealed) pendingFit = true;
			fitMap();
		});
		resizeObserver.observe(container);
		return () => {
			mobileViewport.removeEventListener('change', updateMobileViewport);
			resizeObserver.disconnect();
			instance.un('postrender', updateIndicators);
			popup?.setMap(null);
			instance.dispose();
		};
	});

	$effect(() => {
		popup?.setPosition(popupCoordinate);
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
		if (revealed) {
			if (chosen) {
				const line = new Feature(new LineString([start, chosen]));
				line.setStyle(
					new Style({ stroke: new Stroke({ color: '#343b44', width: 3, lineDash: [8, 8] }) })
				);
				markers.addFeature(line);
			}
			if (mode === 'explore') map.getView().setMinZoom(0);
			pendingFit = true;
			fitMap();
		}
		// Target/reveal changes also need an update when the view hasn't moved.
		map.render();
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
	tabindex={mode === 'explore' ? 0 : -1}
	onkeydown={(event) => {
		if (event.key === 'Escape' && popupCoordinate) {
			closePopup();
			container.focus({ preventScroll: true });
		}
	}}
>
	{#if startIndicator && (mode === 'explore' || revealed)}
		<button
			type="button"
			class="map-indicator"
			style:left={`${startIndicator.x}px`}
			style:top={`${startIndicator.y}px`}
			aria-label="Retour au départ"
			title="Retour au départ"
			onclick={() => {
				// The indicator disappears during the flight; keep keyboard focus on the map.
				container.focus({ preventScroll: true });
				returnToStart();
			}}
		>
			<svg viewBox="-24 -24 48 48" aria-hidden="true">
				<g transform={`rotate(${startIndicator.angle})`}>
					<path d="M22 0 L8 -13 L8 13 Z" fill="#b7410e" stroke="white" stroke-width="2" />
					<circle r="14" fill="white" stroke="#b7410e" stroke-width="3" />
					<circle r="6" fill="#b7410e" />
				</g>
			</svg>
		</button>
	{/if}
	{#each checkpointPositions as position, index (index)}
		<button
			type="button"
			class="map-indicator checkpoint-indicator"
			style:left={`${position.x}px`}
			style:top={`${position.y}px`}
			aria-label={`Retour au checkpoint ${index + 1}`}
			title={`Retour au checkpoint ${index + 1}`}
			onclick={() => {
				container.focus({ preventScroll: true });
				flyTo(position.coordinate);
			}}
		>
			<svg viewBox="-24 -24 48 48" aria-hidden="true">
				{#if position.angle !== undefined}
					<path
						d="M22 0 L8 -13 L8 13 Z"
						transform={`rotate(${position.angle})`}
						fill="#1565c0"
						stroke="white"
						stroke-width="2"
					/>
				{/if}
				<circle r="14" fill="#1565c0" stroke="white" stroke-width="3" />
				<text text-anchor="middle" dy="0.35em" fill="white">{index + 1}</text>
			</svg>
		</button>
	{/each}
</div>

<div
	bind:this={popupElement}
	class="checkpoint-popup"
	hidden={!popupCoordinate}
	role="group"
	aria-label="Ajouter un checkpoint sur la carte"
>
	<button type="button" class="ghost" onclick={addCheckpoint}>Ajouter un checkpoint</button>
	<button
		type="button"
		class="popup-close"
		aria-label="Fermer le popup"
		onclick={() => {
			closePopup();
			container.focus({ preventScroll: true });
		}}>✕</button
	>
</div>

{#if map && mode === 'explore'}
	<Mapant />
{/if}

<style>
	.game-map {
		position: relative;
		overflow: hidden;
		width: 100%;
		height: 100%;
		min-height: 220px;
		background: #f3f1eb;
	}
	.game-map .map-indicator {
		position: absolute;
		/* Keep markers above the floating map controls, including the mobile sidebar toggle. */
		z-index: 4;
		width: 48px;
		height: 48px;
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		box-shadow: none;
		transform: translate(-50%, -50%);
		cursor: pointer;
	}
	.map-indicator svg {
		display: block;
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 1px 3px rgb(0 0 0 / 30%));
	}
	.checkpoint-indicator text {
		font: bold 14px sans-serif;
	}
	.game-map .map-indicator:focus-visible {
		outline: 2px solid var(--pico-primary);
		outline-offset: -2px;
	}
	.checkpoint-popup {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border: 1px solid #d7d7d7;
		border-radius: 0.35rem;
		background: white;
		box-shadow: 0 2px 8px rgb(0 0 0 / 20%);
	}
	.checkpoint-popup[hidden] {
		display: none;
	}
	.checkpoint-popup::after {
		content: '';
		position: absolute;
		left: calc(50% - 7px);
		bottom: -8px;
		width: 14px;
		height: 14px;
		border-right: 1px solid #d7d7d7;
		border-bottom: 1px solid #d7d7d7;
		background: white;
		transform: rotate(45deg);
	}
	.checkpoint-popup button {
		margin: 0;
		padding: 0.5rem 0.75rem;
		font-size: 0.85rem;
		white-space: nowrap;
	}
	.checkpoint-popup .ghost {
		border-color: transparent;
		background: transparent;
		color: var(--pico-primary);
		box-shadow: none;
	}
	.checkpoint-popup .ghost:hover {
		background: var(--pico-primary-focus);
		color: var(--pico-primary-hover);
	}
	.checkpoint-popup .ghost:focus-visible {
		outline: 2px solid var(--pico-primary);
		outline-offset: 2px;
	}
	.checkpoint-popup .popup-close {
		padding: 0.5rem;
		border: 0;
		background: transparent;
		color: #343b44;
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

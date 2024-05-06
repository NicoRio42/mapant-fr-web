<script>
	import { page } from '$app/stores';
	import BaseMap from '$lib/components/map/BaseMap.svelte';
	import Polygon from '$lib/components/map/Polygon.svelte';
	import VectorLayer from '$lib/components/map/VectorLayer.svelte';
	import { FRANCE_CENTER } from '$lib/constants';
	import Stepper from '../Stepper.svelte';

	export let center = FRANCE_CENTER;

	let isLandscape = false;

	const A4_WIDTH = 21 * 100; // metter
	const A4_HEIGHT = 29.7 * 100; // metter

	const A3_WIDTH = A4_HEIGHT; // metter
	const A3_HEIGHT = A4_WIDTH * 2; // metter

	const A2_WIDTH = A3_HEIGHT; // metter
	const A2_HEIGHT = A3_WIDTH * 2; // metter

	const A1_WIDTH = A2_HEIGHT; // metter
	const A1_HEIGHT = A2_WIDTH * 2; // metter

	const A0_WIDTH = A1_HEIGHT; // metter
	const A0_HEIGHT = A1_WIDTH * 2; // metter

	const MINUS_A1_WIDTH = A0_HEIGHT; // metter
	const MINUS_A1_HEIGHT = A0_WIDTH * 2; // metter

	const formulas = [
		{
			id: '1',
			width: A3_WIDTH,
			height: A3_HEIGHT
		},
		{
			id: '2',
			width: A1_WIDTH,
			height: A1_HEIGHT
		},
		{
			id: '3',
			width: MINUS_A1_WIDTH,
			height: MINUS_A1_HEIGHT
		},
		{
			id: '4',
			width: 50000,
			height: 50000
		}
	];

	const selectedFormula =
		formulas.find((f) => f.id === $page.url.searchParams.get('formula')) ?? formulas[0];

	$: coordinates = [
		[
			center[0] + (isLandscape ? selectedFormula.height : selectedFormula.width) / 2,
			center[1] + (isLandscape ? selectedFormula.width : selectedFormula.height) / 2
		],
		[
			center[0] + (isLandscape ? selectedFormula.height : selectedFormula.width) / 2,
			center[1] - (isLandscape ? selectedFormula.width : selectedFormula.height) / 2
		],
		[
			center[0] - (isLandscape ? selectedFormula.height : selectedFormula.width) / 2,
			center[1] - (isLandscape ? selectedFormula.width : selectedFormula.height) / 2
		],
		[
			center[0] - (isLandscape ? selectedFormula.height : selectedFormula.width) / 2,
			center[1] + (isLandscape ? selectedFormula.width : selectedFormula.height) / 2
		]
	];

	$: console.log(center);
</script>

<Stepper selectedStepNumber={3} />

<label>
	Orientation
	<input type="checkbox" bind:checked={isLandscape} />
</label>

<BaseMap bind:center zoom={7}>
	<VectorLayer>
		<Polygon color="blue" width={2} coords={coordinates} />
	</VectorLayer>
</BaseMap>

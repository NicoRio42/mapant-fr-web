<script lang="ts">
	import { page } from '$app/stores';
	import Toggle from '$lib/components/Toggle.svelte';
	import BaseMap from '$lib/components/map/BaseMap.svelte';
	import Polygon from '$lib/components/map/Polygon.svelte';
	import VectorLayer from '$lib/components/map/VectorLayer.svelte';
	import { FRANCE_CENTER } from '$lib/constants';
	import type { Feature } from 'ol';
	import Stepper from '../Stepper.svelte';
	import { clickOutside } from '$lib/actions/click-outside';

	export let center = FRANCE_CENTER;

	let isLandscape = false;
	let selected: Feature | null = null;
	let showDropdown = false;

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
			label: 'A4 10€',
			width: A4_WIDTH,
			height: A4_HEIGHT
		},
		{
			id: '2',
			label: 'A3 20€',
			width: A3_WIDTH,
			height: A3_HEIGHT
		},
		{
			id: '3',
			label: 'A1 50€',
			width: A1_WIDTH,
			height: A1_HEIGHT
		},
		{
			id: '4',
			label: 'Double A0 100€',
			width: MINUS_A1_WIDTH,
			height: MINUS_A1_HEIGHT
		},
		{
			id: '5',
			label: 'Méga tuile 500€',
			width: 50000,
			height: 50000
		}
	];

	$: selectedFormula =
		formulas.find((f) => f.id === $page.url.searchParams.get('formula')) ?? formulas[0];

	$: isMegaTileFormula = selectedFormula.id === '5';

	$: halfWidth = (isLandscape ? selectedFormula.height : selectedFormula.width) / 2;
	$: halfHeight = (isLandscape ? selectedFormula.width : selectedFormula.height) / 2;

	$: minX = center[0] - halfWidth;
	$: maxX = center[0] + halfWidth;
	$: minY = center[1] - halfHeight;
	$: maxY = center[1] + halfHeight;

	$: coordinates = [
		[minX, maxY],
		[maxX, maxY],
		[maxX, minY],
		[minX, minY]
	];
</script>

<Stepper selectedStepNumber={3} />

<BaseMap bind:center zoom={7} allowLidarTileSelection={isMegaTileFormula} bind:selected>
	{#if !isMegaTileFormula}
		<VectorLayer>
			<Polygon color="blue" width={2} coords={coordinates} fill="#60a5fa4a" />
		</VectorLayer>
	{/if}

	<div absolute right-2 bottom-2 flex="~ col" gap-2>
		<div class="dropdown" use:clickOutside={() => (showDropdown = false)}>
			{#if showDropdown}
				<ul bg-white mb-0 rounded p="y-2 x-3">
					{#each formulas as formula (formula.id)}
						<li list-none m-0>
							<a block p-y-1 on:click={() => (showDropdown = false)} href="?formula={formula.id}">
								{formula.label}
							</a>
						</li>
					{/each}
				</ul>
			{/if}

			<button
				p="y-1 x-2"
				w-full
				bg-white
				flex
				items-center
				justify-between
				class="outline"
				on:click={() => (showDropdown = !showDropdown)}
			>
				{selectedFormula.label}

				<i i-carbon-chevron-down block w-5 h-5></i>
			</button>
		</div>

		{#if !isMegaTileFormula}
			<Toggle firstLabel="Paysage" secondLabel="Portrait" bind:isFirstValueSelected={isLandscape} />
		{/if}

		<form method="post">
			{#if isMegaTileFormula}
				<!-- I want no input hidden if isMegaTileFormula false and selected null -->
				{#if selected !== null}
					{@const bbox = selected.getProperties().bbox}
					<input type="hidden" name="minX" value={bbox[0]} />
					<input type="hidden" name="minY" value={bbox[1]} />
					<input type="hidden" name="maxX" value={bbox[2]} />
					<input type="hidden" name="maxY" value={bbox[3]} />
				{/if}
			{:else}
				<input type="hidden" name="minX" value={minX} />
				<input type="hidden" name="minY" value={minY} />
				<input type="hidden" name="maxX" value={maxX} />
				<input type="hidden" name="maxY" value={maxY} />
			{/if}

			<button
				type="submit"
				m-0
				p="y-1 x-2"
				flex
				items-center
				gap-2
				disabled={isMegaTileFormula && selected === null}
			>
				Valider cette zone

				<i i-carbon-arrow-right block w-5 h-5></i>
			</button>
		</form>
	</div>
</BaseMap>

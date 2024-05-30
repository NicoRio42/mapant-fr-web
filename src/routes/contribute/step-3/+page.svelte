<script lang="ts">
	import { page } from '$app/stores';
	import Toggle from '$lib/components/Toggle.svelte';
	import BaseMap from '$lib/components/map/BaseMap.svelte';
	import Polygon from '$lib/components/map/Polygon.svelte';
	import VectorLayer from '$lib/components/map/VectorLayer.svelte';
	import { CONTRIBUTION_FORMULAS, FRANCE_CENTER, type ContributionFormula } from '$lib/constants';
	import type { Feature } from 'ol';
	import Stepper from '../Stepper.svelte';
	import { clickOutside } from '$lib/actions/click-outside';
	import { fade } from 'svelte/transition';

	export let center = FRANCE_CENTER;

	let isLandscape = false;
	let selected: Feature | null = null;
	let showDropdown = false;
	let isLidarHdTilesLayerDisplayed = true;
	let showHelp = true;
	let selectedFormula: ContributionFormula;

	$: {
		selectedFormula =
			CONTRIBUTION_FORMULAS.find((f) => f.id === $page.url.searchParams.get('formula')) ??
			CONTRIBUTION_FORMULAS[0];

		showHelp = true;
	}

	$: isMegaTileFormula = selectedFormula.id === '5';
	$: if (isMegaTileFormula) isLidarHdTilesLayerDisplayed = true;

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

<BaseMap
	bind:center
	bind:selected
	bind:isLidarHdTilesLayerDisplayed
	zoom={7}
	allowLidarTileSelection={isMegaTileFormula}
>
	{#if !isMegaTileFormula}
		<VectorLayer>
			<Polygon color="blue" width={2} coords={coordinates} fill="#60a5fa4a" />
		</VectorLayer>
	{/if}

	<div absolute right-2 bottom-2 flex="~ col" gap-2>
		<div class="dropdown" use:clickOutside={() => (showDropdown = false)}>
			{#if showDropdown}
				<ul bg-white mb-0 rounded p="y-2 x-3" shadow-2xl>
					{#each CONTRIBUTION_FORMULAS as formula (formula.id)}
						<li list-none m-0>
							<a
								block
								p-y-1
								text-nowrap
								decoration-none
								flex
								justify-between
								on:click={() => (showDropdown = false)}
								href="?formula={formula.id}"
							>
								<span>{formula.label}</span>

								<span>{formula.priceInEuros} €</span>
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
				<span grow text-left>{selectedFormula.label}</span>

				<span>{selectedFormula.priceInEuros} €</span>

				<i i-carbon-chevron-down block w-5 h-5 ml-2></i>
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

	<button
		type="button"
		class="outline"
		bg-white
		absolute
		right-2
		top-12
		mb-0
		w-8
		h-8
		p-0
		flex
		items-center
		justify-center
		on:click={() => (showHelp = !showHelp)}
	>
		<i i-carbon-help block w-5 h-5></i>
	</button>

	{#if showHelp}
		<article
			absolute
			top-2
			left-14
			right-12
			max-w-100
			bg-green
			mb-0
			mr-2
			transition:fade={{ duration: 125 }}
		>
			<button
				type="button"
				mb-0
				p-0
				float-right
				border-none
				shadow="focus:none"
				text-h1-color
				class="outline"
				on:click={() => (showHelp = false)}
			>
				<i i-carbon-close-large block w-5 h-5></i>
			</button>

			{#if selectedFormula.id === '5'}
				Sélectionnez une dalle de 50km par 50km en cliquant sur une tuile orange.
			{:else}
				Centrez le rectangle bleu sur la zone qui vous intéresse en zoomant et déplaçant la carte.
			{/if}
		</article>
	{/if}
</BaseMap>

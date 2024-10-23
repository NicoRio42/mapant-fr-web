<script lang="ts">
	import Step from './Step.svelte';

	interface Props {
		selectedStepNumber: number;
	}

	let { selectedStepNumber }: Props = $props();

	const labels = ['Créer un compte', 'Choisir une formule', 'Choisir la zone', null];
</script>

<div flex="~ col" items-center my-4>
	<ul px-0 flex gap-2 justify-center m-0>
		<Step stepNumber={1} {selectedStepNumber} />

		<hr w-8 border-b="solid 1 primary" />

		<Step stepNumber={2} {selectedStepNumber} />

		<hr w-8 border-b="solid 1 primary" />

		<Step stepNumber={3} {selectedStepNumber} />

		<hr w-8 border-b="solid 1 primary" />

		<Step stepNumber={4} {selectedStepNumber} />
	</ul>

	{#if labels[selectedStepNumber - 1]}
		<h1 m-0 mt-2 text-6 leading-6>{labels[selectedStepNumber - 1]}</h1>
	{/if}
</div>

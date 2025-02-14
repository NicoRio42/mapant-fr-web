<script lang="ts">
	import Step from './Step.svelte';

	interface Props {
		selectedStepNumber: number;
	}

	let { selectedStepNumber }: Props = $props();
</script>

<ul px-0 flex gap-2 justify-center m="t-8 b-0">
	<Step stepNumber={1} {selectedStepNumber} />

	<hr w-8 border-b="solid 1 primary" />

	<Step stepNumber={2} {selectedStepNumber} />

	<hr w-8 border-b="solid 1 primary" />

	<Step stepNumber={3} {selectedStepNumber} />

	<hr w-8 border-b="solid 1 primary" />

	<Step stepNumber={4} {selectedStepNumber} />
</ul>

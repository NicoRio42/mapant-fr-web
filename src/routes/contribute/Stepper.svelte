<script lang="ts">
	import Step from './Step.svelte';

	export let selectedStepNumber: number;
</script>

<ul px-0 flex gap-4 justify-center mt-6>
	<Step stepNumber={1} title="Créer un compte" selected={selectedStepNumber === 1} />
	<Step stepNumber={2} title="Choisir une formule" selected={selectedStepNumber === 2} />
	<Step stepNumber={3} title="Choisir la zone" selected={selectedStepNumber === 3} />
	<Step stepNumber={4} title="Merci" selected={selectedStepNumber === 4} />
</ul>

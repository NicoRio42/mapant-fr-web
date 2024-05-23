<script>
	import Stepper from '../Stepper.svelte';

	export let data;
</script>

<Stepper selectedStepNumber={4} />

<main>
	<h1>Merci pour votre contribution !</h1>

	<p>
		<a href="/contribute/step-1">Faire une autre contribution</a>
	</p>

	<p>
		<a href="/contributions">Vos contributions</a>
	</p>
</main>

<script>
	import Stepper from '../Stepper.svelte';

	export let data;
</script>

<Stepper selectedStepNumber={4} />

<main>
	<h1>Merci pour votre contribution !</h1>

	<a href="/contribute/step-1">Faire une autre contribution</a>

	<p>Vos contributions</p>

	{#each data.contributions as contribution (contribution.id)}
		<article>
			{contribution.formula}
		</article>
	{/each}
</main>

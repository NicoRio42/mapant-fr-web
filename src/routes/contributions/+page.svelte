<script>
	export let data;
</script>

<main>
	<h1>Vos contributions à Mapant.fr</h1>

	<a href="/contribute/step-1">Faire une autre contribution</a>

	{#each data.contributions as contribution (contribution.id)}
		<article>
			{contribution.formula}
		</article>
	{/each}
</main>

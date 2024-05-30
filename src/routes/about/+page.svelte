<script>
	import content from './about.md';
</script>

<main container max-w-200 m-x-auto py-8 px-4>
	<h1>A propos de Mapant.fr</h1>

	{@html content}

	<p text-right>
		<a
			href="/contribute/step-1"
			role="button"
			class="!inline-flex !py-1 outline"
			items-center
			gap-2
			w-fit
		>
			<i i-carbon-crop-growth block w5 h5></i>

			Contribuer
		</a>
	</p>
</main>

<script>
	import Stepper from '../Stepper.svelte';

	let { isUserConnected } = $props();
</script>

<Stepper selectedStepNumber={4} />

<main px-4 mx-auto max-w-150 mt-4>
	<h1>
		<i i-twemoji-folded-hands inline-block w-7 h-7></i>

		Merci pour votre contribution !
	</h1>

	{#if isUserConnected}
		<p>
			Nous vous tiendrons informé par email si vous avez coché cette option lors de votre
			inscription.
		</p>
	{/if}

	<p>
		Si vous avez besoin d'une facture, ou pour toute autre question, n'hésitez pas à envoyer un mail
		à <a href="mailto:contact@mapant.fr" target="_blank">contact@mapant.fr</a>.
	</p>

	<p>
		<a role="button" class="outline !flex" items-center gap-2 w-fit href="/contribute/step-2">
			<i i-carbon-crop-growth block w-5 h-5></i>
			Faire une autre contribution
		</a>
	</p>

	{#if isUserConnected}
		<p>
			<a role="button" class="outline !flex" items-center gap-2 w-fit href="/contributions">
				<i i-carbon-view block w-5 h-5></i>
				Voir mes contributions
			</a>
		</p>
	{/if}
</main>

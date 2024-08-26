<script lang="ts">
	import { CONTRIBUTION_FORMULAS, type ContributionFormula } from '$lib/constants';
	import type { Contribution } from '$lib/server/schema';

	export let data;

	function getFormula(id: Contribution['id']): ContributionFormula {
		return CONTRIBUTION_FORMULAS.find((f) => f.id === id)!;
	}
</script>

<main px-4 max-w-200 mx-auto mt-8>
	<div flex="~ col md:row" gap-6>
		<h1 m-0 grow>Vos contributions à Mapant.fr</h1>

		<a
			href="/contribute/step-1"
			role="button"
			self="end md:center"
			p="!y-1 !x-2"
			h-fit
			w-fit
			class="!flex"
			items-center
			gap-2
		>
			<i i-carbon-add block w-5 h-5 shrink-0></i>

			Faire une autre contribution
		</a>
	</div>

	<div grid="~ sm:cols-2 md:cols-3" gap-8 mt-6>
		{#each data.contributions as contribution (contribution.id)}
			{@const formula = getFormula(contribution.formula)}

			<article>
				<h2 flex items-center gap-2>
					<i i-carbon-document-blank block w-6 h-6></i>

					{formula.label}
				</h2>

				<p text-left>
					{#if contribution.paied}
						Payée
					{:else}
						Non payée

						<a href="{formula.paiementLink}?client_reference_id={contribution.id}">
							Lien de paiement

							<i i-carbon-launch inline-block w-4 h-4></i>
						</a>
					{/if}
				</p>

				<p>
					<a href="/contributions/{contribution.id}" flex items-center gap-2 decoration-none>
						<i i-carbon-view inline-block w-6 h-6></i>

						Voir
					</a>
				</p>
			</article>
		{/each}

		{#each data.contributionsWithoutCompensation as contribution (contribution.id)}
			{@const formula = getFormula(contribution.formula)}

			<article>
				<h2 flex items-center gap-2>
					<i i-twemoji-folded-hands block w-6 h-6></i>

					{formula.priceInEuros}&nbsp;€
				</h2>

				<p text-left>
					{#if contribution.paied}
						Payée
					{:else}
						Non payée

						<a href="{formula.paiementLink}?client_reference_id={contribution.id}">
							Lien de paiement

							<i i-carbon-launch inline-block w-4 h-4></i>
						</a>
					{/if}
				</p>
			</article>
		{/each}
	</div>
</main>

<script lang="ts">
	export let title: string;
	export let price: number;
	export let linkText: string;
	export let formulaId: string;
</script>

<article flex="~ col" justify-between m-0 px-8 class={$$restProps.class}>
	<div contents>
		<header flex items-center pb-6>
			<h2 grow mb-0 flex items-center gap-2>
				<i i-carbon-document-blank block w-8 h-8></i>

				{title}
			</h2>

			<p mb-0 text-8 font-700>{price} €</p>
		</header>

		<p>
			<slot></slot>
		</p>
	</div>

	<p text-right>
		<a role="button" href="/contribute/step-3?formula={formulaId}">{linkText}</a>
	</p>
</article>

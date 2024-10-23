<script lang="ts">
	interface Props {
		title: string;
		price: number;
		linkText: string;
		formulaId: string;
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let {
		title,
		price,
		linkText,
		formulaId,
		children,
		...rest
	}: Props = $props();
</script>

<article flex="~ col" justify-between m-0 px-8 class={rest.class}>
	<div contents>
		<header flex items-center pb-6>
			<h2 grow mb-0 flex items-center gap-2>
				<i i-carbon-document-blank block w-8 h-8></i>

				{title}
			</h2>

			<p mb-0 text-8 font-700>{price}&nbsp;€</p>
		</header>

		<p>
			{@render children?.()}
		</p>
	</div>

	<p flex justify-end>
		<a
			role="button"
			class="outline"
			flex="!~"
			w-fit
			gap-1.5
			items-center
			href="/contribute/step-3?formula={formulaId}"
		>
			{linkText}

			<i i-carbon-arrow-right inline-block w-5 h-5></i>
		</a>
	</p>
</article>

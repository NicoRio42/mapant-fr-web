<script lang="ts">
	export let title: string;
	export let price: number;
	export let linkText: string;
	export let formulaId: string;
	export let colspan = 1;
</script>

<article style:grid-column="span {colspan}">
	<header flex items-center py-6>
		<h2 grow mb-0>{title}</h2>

		<p mb-0 text-8 font-700>{price} €</p>
	</header>

	<p>
		<slot></slot>
	</p>

	<p text-right>
		<a role="button" href="/contribute/step-3?formula={formulaId}">{linkText}</a>
	</p>
</article>

<script lang="ts">
	export let stepNumber: number;
	export let title: string;
	export let selected: boolean;
</script>

<li list-none flex items-center gap-2>
	<span bg-primary flex items-center justify-center w-9 h-9 rounded-full>
		{stepNumber}
	</span>

	{#if selected}
		{title}
	{/if}
</li>

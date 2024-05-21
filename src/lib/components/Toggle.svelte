<script lang="ts">
	export let isFirstValueSelected: boolean;
	export let firstLabel: string;
	export let secondLabel: string;
</script>

<div flex>
	<button
		on:click={() => (isFirstValueSelected = true)}
		w-full
		p="y-1 x-2"
		rounded-r-0
		class:not-selected={!isFirstValueSelected}
	>
		{firstLabel}
	</button>

	<button
		on:click={() => (isFirstValueSelected = false)}
		w-full
		p="y-1 x-2"
		rounded-l-0
		class:not-selected={isFirstValueSelected}
	>
		{secondLabel}
	</button>
</div>

<style>
	.not-selected {
		background-color: white;
		color: var(--pico-primary);
	}
</style>

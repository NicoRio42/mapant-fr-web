<script lang="ts">
	interface Props {
		isFirstValueSelected: boolean;
		firstLabel: string;
		secondLabel: string;
	}

	let { isFirstValueSelected = $bindable(), firstLabel, secondLabel }: Props = $props();
</script>

<div flex>
	<button
		onclick={() => (isFirstValueSelected = true)}
		w-full
		p="y-1 x-2"
		rounded-r-0
		class:not-selected={!isFirstValueSelected}
	>
		{firstLabel}
	</button>

	<button
		onclick={() => (isFirstValueSelected = false)}
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

<script lang="ts">
	export let stepNumber: number;
	export let selectedStepNumber: number;
</script>

<li list-none flex items-center gap-2>
	{#if stepNumber < selectedStepNumber}
		<span bg-primary-background flex items-center justify-center w-9 h-9 rounded-full text-white>
			<i i-carbon-checkmark block w-5 h-5></i>
		</span>
	{:else if stepNumber === selectedStepNumber}
		<span bg-primary-background flex items-center justify-center w-9 h-9 rounded-full text-white>
			{stepNumber}
		</span>
	{:else}
		<span
			border="solid 1 primary"
			flex
			items-center
			justify-center
			w-9
			h-9
			rounded-full
			text-primary
		>
			{stepNumber}
		</span>
	{/if}
</li>

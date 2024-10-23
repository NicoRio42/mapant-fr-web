<script lang="ts">
	interface Props {
		label: string;
		displayed: boolean;
		opacity: number;
		children?: import('svelte').Snippet;
	}

	let {
		label,
		displayed = $bindable(),
		opacity = $bindable(),
		children
	}: Props = $props();
</script>

<li text-left bg="!hover:transparent" list-none>
	<div flex items-center mb="[calc(var(--pico-spacing)*0.375)]">
		<label grow mb-0>
			<input mr-2 type="checkbox" bind:checked={displayed} />

			{label}
		</label>

		{@render children?.()}
	</div>

	<input type="range" min="0" max="1" step="0.01" bind:value={opacity} mb="!0" />
</li>

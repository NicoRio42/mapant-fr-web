<script lang="ts">
	export let label: string;
	export let displayed: boolean;
	export let opacity: number;
</script>

<li text-left bg="!hover:transparent" list-none>
	<div flex items-center mb="[calc(var(--pico-spacing)*0.375)]">
		<label grow mb-0>
			{label}

			<input mr-2 type="checkbox" bind:checked={displayed} />
		</label>

		<slot></slot>
	</div>

	<input type="range" min="0" max="1" step="0.01" bind:value={opacity} mb="!0" />
</li>

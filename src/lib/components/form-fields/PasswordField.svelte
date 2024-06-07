<script lang="ts" context="module">
	type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
	import { onDestroy } from 'svelte';
	import { formFieldProxy, type SuperForm, type FormPathLeaves } from 'sveltekit-superforms';

	export let form: SuperForm<T>;
	export let field: FormPathLeaves<T>;
	export let label: string | undefined = undefined;

	let showPassword = false;
	let errorsHaveBeenshownOnce = false;

	const { value, errors } = formFieldProxy(form, field);

	const unsub = errors.subscribe((errs) => {
		if (!errorsHaveBeenshownOnce) errorsHaveBeenshownOnce = errs !== undefined && errs.length !== 0;
	});

	function shouldDisplayInvalidState() {
		return errorsHaveBeenshownOnce ? $errors !== undefined && $errors.length !== 0 : null;
	}

	onDestroy(unsub);
</script>

<label>
	{#if label !== undefined}
		{label}
	{/if}

	<div class="relative mt-0 mb-[--spacing]" data-invalid={shouldDisplayInvalidState()}>
		{#if showPassword}
			<input
				name={String(field)}
				type="text"
				class="!m-0 password-input"
				bind:value={$value}
				data-invalid={$errors}
				aria-invalid={shouldDisplayInvalidState()}
				{...$$restProps}
			/>
		{:else}
			<input
				name={String(field)}
				type="password"
				class="!m-0 password-input"
				bind:value={$value}
				data-invalid={$errors}
				aria-invalid={shouldDisplayInvalidState()}
				{...$$restProps}
			/>
		{/if}

		<button
			type="button"
			class="unpico absolute right-6 top-50% -translate-y-50% flex justify-center items-center"
			class:right-10={shouldDisplayInvalidState()}
			on:click={() => (showPassword = !showPassword)}
		>
			{#if showPassword}
				<i class="i-carbon-view-off w-6 h-6" />
			{:else}
				<i class="i-carbon-view w-6 h-6" />
			{/if}
		</button>
	</div>

	{#each $errors ?? [] as error}
		<small class="text-del-color mb-0">{error}</small>
	{/each}
</label>

<style>
	input[aria-invalid].password-input {
		padding-right: calc(var(--pico-form-element-spacing-horizontal) + 3rem) !important;
		background-image: none;
	}
</style>

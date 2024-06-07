<script lang="ts" context="module">
	type T = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>">
	import {
		formFieldProxy,
		type FormFieldProxy,
		type SuperForm,
		type FormPathLeaves
	} from 'sveltekit-superforms';
	import { onDestroy } from 'svelte';

	export let form: SuperForm<T>;
	export let field: FormPathLeaves<T, boolean>;
	export let label: string | undefined = undefined;

	let errorsHaveBeenshownOnce = false;

	const { value, errors } = formFieldProxy(form, field) satisfies FormFieldProxy<boolean>;

	const unsub = errors.subscribe((errs) => {
		if (!errorsHaveBeenshownOnce) errorsHaveBeenshownOnce = errs !== undefined && errs.length !== 0;
	});

	onDestroy(unsub);
</script>

<label>
	{#if label !== undefined}
		{label}
	{/if}

	<input
		name={String(field)}
		type="checkbox"
		bind:checked={$value}
		data-invalid={$errors}
		aria-invalid={errorsHaveBeenshownOnce ? $errors !== undefined && $errors.length !== 0 : null}
		{...$$restProps}
	/>

	{#each $errors ?? [] as error}
		<small class="text-del-color mb-0">{error}</small>
	{/each}
</label>

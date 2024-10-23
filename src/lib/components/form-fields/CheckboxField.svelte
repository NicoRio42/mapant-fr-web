<script lang="ts" module>
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

	interface Props {
		form: SuperForm<T>;
		field: FormPathLeaves<T, boolean>;
		label?: string | undefined;
		[key: string]: any
	}

	let { form, field, label = undefined, ...rest }: Props = $props();

	let errorsHaveBeenshownOnce = $state(false);

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
		{...rest}
	/>

	{#each $errors ?? [] as error}
		<small class="text-del-color mb-0">{error}</small>
	{/each}
</label>

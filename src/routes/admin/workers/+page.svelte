<script>
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { workerFormSchema } from './worker-form-schema';

	let { data } = $props();

	const form = superForm(data.form, { validators: zodClient(workerFormSchema) });
	const { enhance, delayed, errors, form: formStore } = form;
</script>

<main p="x-6 y-8" mx-auto max-w-150>
	<h1>Workers</h1>

	<form method="post" use:enhance>
		<fieldset role="group">
			<input type="text" placeholder="Worker name" bind:value={$formStore.name} />

			<button type="submit" aria-busy={$delayed} text-nowrap>New Worker</button>
		</fieldset>

		{#each $errors._errors ?? [] as globalError}
			<p>
				<small class="text-del-color mb-0">{globalError}</small>
			</p>
		{/each}
	</form>

	{#if data.workers.length !== 0}
		<ul>
			{#each data.workers as worker}
				<li>{worker.name}</li>
			{/each}
		</ul>
	{:else}
		<p>No worker yet</p>
	{/if}
</main>

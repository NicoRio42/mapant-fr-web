<script lang="ts">
	import { enhance as sveltekitEnhance } from '$app/forms';
	import { confirmSubmit } from '$lib/actions/confirm-submit';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { workerFormSchema } from './worker-form-schema';

	let { data } = $props();

	const form = superForm(data.form, { validators: zodClient(workerFormSchema) });
	const { enhance, delayed, errors, form: formStore } = form;

	async function rotateToken(worker: { id: string; name: string; hasToken: boolean }) {
		if (worker.hasToken && !confirm('Are you sure to override worker API key?')) return;

		const newApiKeyResponse = await fetch(`/admin/workers/${worker.id}/create-api-key`, {
			method: 'POST'
		});

		if (!newApiKeyResponse.ok) {
			alert('Something went wrong');
			return;
		}

		const newApiKey = await newApiKeyResponse.text();
		alert(`New API key for worker "${worker.name}": ${newApiKey}`);
	}
</script>

<main p="x-6 y-8" mx-auto max-w-150>
	<h1>Workers</h1>

	<form action="?/add" method="post" use:enhance>
		<fieldset role="group">
			<input type="text" placeholder="Worker name" name="name" bind:value={$formStore.name} />

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
			{#each data.workers as worker (worker.id)}
				<li>
					<div flex items-center gap-4>
						{worker.name}

						{worker.id}

						<button type="button" onclick={() => rotateToken(worker)}>
							{worker.hasToken ? 'Rotate token' : 'Create token'}
						</button>

						<form
							use:confirmSubmit={'Are you sure?'}
							use:sveltekitEnhance
							action="?/delete"
							method="post"
							contents
						>
							<input type="hidden" name="worker-id" value={worker.id} />

							<button
								type="submit"
								w="!fit"
								shrink-0
								flex
								items-center
								justify-center
								p="!2"
								class="outline"
							>
								<i i-carbon-trash-can w-5 h-5 inline-block></i>
							</button>
						</form>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p>No worker yet</p>
	{/if}
</main>

<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { loginSchema } from './login-schema.js';
	import EmailField from '$lib/components/form-fields/EmailField.svelte';
	import PasswordField from '$lib/components/form-fields/PasswordField.svelte';

	export let data;

	const form = superForm(data.form, { validators: zodClient(loginSchema) });
	const { enhance, delayed, errors } = form;
</script>

<article class="max-w-120 mx-auto mt-0 sm:mt-8">
	<h1>Connexion</h1>

	<form method="post" use:enhance>
		<EmailField {form} field="email" label="Adresse email" />

		<PasswordField {form} field="password" label="Mot de passe" />

		<button type="submit" aria-busy={$delayed}>Connexion</button>

		{#each $errors._errors ?? [] as globalError}
			<p>
				<small class="text-del-color mb-0">{globalError}</small>
			</p>
		{/each}
	</form>

	<p>Vous n'avez pas encore de compte ? <a href="/contribute/step-1">Créer un compte</a></p>
</article>

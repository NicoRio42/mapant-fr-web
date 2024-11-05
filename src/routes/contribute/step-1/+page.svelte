<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import Stepper from '../Stepper.svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { signUpSchema } from './signup-schema';
	import EmailField from '$lib/components/form-fields/EmailField.svelte';
	import PasswordField from '$lib/components/form-fields/PasswordField.svelte';
	import CheckboxField from '$lib/components/form-fields/CheckboxField.svelte';

	let { data } = $props();

	const form = superForm(data.form, { validators: zodClient(signUpSchema) });
	const { enhance, delayed } = form;
</script>

<Stepper selectedStepNumber={1} />

<main>
	<form method="post" use:enhance max-w-100 px-4 mx-auto mt-8>
		<EmailField {form} field="email" label="Adresse email" />

		<PasswordField {form} field="password" label="Mot de passe" />

		<CheckboxField
			{form}
			field="keepInTouch"
			label="Me tenir informé de la progression du projet"
		/>

		<button type="submit" aria-busy={$delayed} class="big" mt-4> Valider </button>

		<p>
			Vous avez déjà un compte ? <a
				href="/login?redirect-url={encodeURIComponent('/contribute/step-2')}">Connectez vous !</a
			>
		</p>
	</form>
</main>

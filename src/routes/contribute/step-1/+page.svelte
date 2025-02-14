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
	<div max-w-100 px-4 mx-auto>
		<a
			href="/contribute/step-2"
			role="button"
			class="big"
			w-full
			mt-8
			flex="!~"
			justify-center
			items-center
			gap-2
		>
			<i i-carbon-crop-growth inline-block w-6 h-6></i>

			Faire un don rapide
		</a>

		<p text-center mt-8>Ou</p>

		<p m="t-8 b-0" text="6 center">Créer un compte</p>

		<p text="center 3.5" mt-0>(Pour garder une trace de vos contributions)</p>

		<form method="post" use:enhance mt-8>
			<EmailField {form} field="email" label="Adresse email" />

			<PasswordField {form} field="password" label="Mot de passe" />

			<CheckboxField
				{form}
				field="keepInTouch"
				label="Me tenir informé de la progression du projet"
			/>

			<button type="submit" aria-busy={$delayed} class="big outline" mt-4> Valider </button>

			<p>
				Vous avez déjà un compte ? <a
					href="/login?redirect-url={encodeURIComponent('/contribute/step-2')}">Connectez vous !</a
				>
			</p>
		</form>
	</div>
</main>

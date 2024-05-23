<script lang="ts">
	import { enhance } from '$app/forms';
	import Stepper from '../Stepper.svelte';

	export let form;

	let showPassword = false;
	let passwordInput: HTMLInputElement;
</script>

<Stepper selectedStepNumber={1} />

<main>
	<form method="post" use:enhance max-w-100 px-4 mx-auto mt-8>
		<label>
			Adresse email

			<input id="signup-email" type="email" name="email" required />
		</label>

		{#if form?.emailAlllreadyUsed}
			<label for="signup-email">
				Cette adresse email est déjà utilisée.

				<a href="/login?redirect-url={encodeURIComponent('/contribute/step-2')}">
					Connectez vous avec votre compte !
				</a>
			</label>
		{/if}

		<label for="signup-password" grow> Mot de passe </label>

		<div relative m-b-spacing>
			<input
				id="signup-password"
				bind:this={passwordInput}
				type="password"
				name="password"
				required
				minlength="12"
				maxlength="20"
				class="!m-b-0"
			/>

			<label absolute top="50%" translate-y="-50%" right-4 m-0>
				{#if showPassword}
					<i i-carbon-view-off block h-6 w-6></i>
				{:else}
					<i i-carbon-view block h-6 w-6></i>
				{/if}

				<input
					hidden
					type="checkbox"
					bind:checked={showPassword}
					on:change={passwordInput.setAttribute('type', showPassword ? 'text' : 'password')}
				/>
			</label>
		</div>

		<label>
			<input type="checkbox" name="keep-in-touch" />

			Me tenir informé de la progression du projet
		</label>

		<button type="submit" mt-8> Valider </button>

		<p>
			Vous avez déjà un compte ? <a
				href="/login?redirect-url={encodeURIComponent('/contribute/step-2')}">Connectez vous !</a
			>
		</p>
	</form>
</main>

<script>
	import { enhance } from '$app/forms';
	import Stepper from '../Stepper.svelte';
</script>

<Stepper selectedStepNumber={1} />

<main>
	<form method="post" use:enhance max-w-100 px-4 mx-auto mt-8>
		<label>
			Adresse email

			<input type="email" name="email" />
		</label>

		<label>
			Mot de passe

			<input type="password" name="password" />
		</label>

		<label>
			<input type="checkbox" name="keep-in-touch" />

			Me tenir informé de la progression du projet
		</label>

		<button type="submit" mt-8 w="md:!fit"> Valider </button>
	</form>
</main>

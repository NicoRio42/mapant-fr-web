<script lang="ts">
	import { enhance } from '$app/forms';

	let loading = false;
	let tooFast = false;
</script>

<article class="max-w-120 mx-auto mt-0 sm:mt-8">
	<h1>Connexion</h1>

	<form
		method="post"
		use:enhance={() => {
			loading = true;
			tooFast = true;
			setTimeout(() => (tooFast = false), 250);
			return ({ update }) => {
				loading = false;
				update();
			};
		}}
	>
		<label>
			Adresse email
			<input type="email" name="email" />
		</label>

		<label>
			Mot de passe
			<input type="password" name="password" />
		</label>

		<button type="submit" aria-busy={loading && !tooFast}>Connexion</button>
	</form>

	<p>Vous n'avez pas encore de compte ? <a href="/signup">Créer un compte</a></p>
</article>

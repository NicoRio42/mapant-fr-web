<script>
	import { enhance } from '$app/forms';
	import Stepper from '../Stepper.svelte';
</script>

<Stepper selectedStepNumber={2} />

<main px-4>
	<p max-w-200 m-x-auto>
		Lorem ipsum dolor, sit amet consectetur adipisicing elit. Eius voluptate et fuga doloribus
		repudiandae facilis velit consectetur porro minus alias magni delectus assumenda, tempore sunt
		accusantium repellendus facere consequatur atque!
	</p>

	<div grid="~ md:cols-2 lg:cols-4" gap-8>
		<article>
			<header>
				<h2>L'amateur de carte</h2>
			</header>

			<a role="button" href="/contribute/step-3?formula=1">Choisir le format A3</a>
		</article>

		<article>
			<header>
				<h2>Le geek de la CO</h2>
			</header>

			<a role="button" href="/contribute/step-3?formula=2">Choisir le format A1</a>
		</article>

		<article>
			<header>
				<h2>Le cartographe</h2>
			</header>

			<a role="button" href="/contribute/step-3?formula=3">Choisir le format A-1</a>
		</article>

		<article>
			<header>
				<h2>Le mécène</h2>
			</header>

			<a role="button" href="/contribute/step-3?formula=4">Choisir une dalle entière</a>
		</article>
	</div>
</main>

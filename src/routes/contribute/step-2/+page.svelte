<script>
	import Formula from './Formula.svelte';

	import Stepper from '../Stepper.svelte';
</script>

<Stepper selectedStepNumber={2} />

<main px-4>
	<p max-w-200 m-x-auto>
		En contrepartie de votre contribution, vous pouvez sélectionner une zone sur la carte de France.
		Elle sera traitée en priorité lors de la génération de la carte à partir des données LiDAR.
	</p>

	<div grid="~ md:cols-2 lg:cols-4" gap-8>
		<Formula title="Format A4" price={10} linkText="Choisir le format A4" formulaId="1">
			La surface équivalente à une carte au format A4 à l'échelle 1:10000
		</Formula>

		<Formula title="Format A3" price={20} linkText="Choisir le format A3" formulaId="2">
			La surface équivalente à une carte au format A3 à l'échelle 1:10000
		</Formula>

		<Formula title="Format A1" price={50} linkText="Choisir le format A1" formulaId="3">
			La surface équivalente à une carte au format A1 à l'échelle 1:10000
		</Formula>

		<Formula
			title="Format double A0"
			price={100}
			linkText="Choisir le format double A0"
			formulaId="4"
		>
			La surface équivalente à une carte au format double A0 à l'échelle 1:10000
		</Formula>

		<Formula
			title="Format méga tuile"
			price={500}
			linkText="Choisir le format A4"
			formulaId="5"
			colspan={2}
		>
			Une méga tuile de 50km par 50km
		</Formula>
	</div>
</main>

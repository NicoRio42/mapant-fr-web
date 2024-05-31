<script>
	import Formula from './Formula.svelte';

	import Stepper from '../Stepper.svelte';
</script>

<Stepper selectedStepNumber={2} />

<main p="x-4 b-12" mx-auto max-w-300>
	<p max-w-200 m="x-auto t-4" text-5>
		En contrepartie de votre contribution, vous pouvez sélectionner une zone sur la carte de France.
		Elle sera <strong> traitée en priorité</strong> lors de la génération de la carte à partir des données
		LiDAR (dans limite du possible).
	</p>

	<div grid="~ md:cols-2 xl:cols-6" gap-8 mt-12>
		<Formula
			title="Format A4"
			price={10}
			linkText="Choisir le format A4"
			formulaId="1"
			class="xl:col-span-2"
		>
			La surface équivalente à une carte au format A4 à l'échelle 1:10000
		</Formula>

		<Formula
			title="Format A3"
			price={20}
			linkText="Choisir le format A3"
			formulaId="2"
			class="xl:col-span-2"
		>
			La surface équivalente à une carte au format A3 à l'échelle 1:10000
		</Formula>

		<Formula
			title="Format A1"
			price={50}
			linkText="Choisir le format A1"
			formulaId="3"
			class="xl:col-span-2"
		>
			La surface équivalente à une carte au format A1 à l'échelle 1:10000
		</Formula>

		<Formula
			title="Format double A0"
			price={100}
			linkText="Choisir le format double A0"
			formulaId="4"
			class="xl:col-span-3"
		>
			La surface équivalente à une carte au format double A0 à l'échelle 1:10000
		</Formula>

		<Formula
			title="Format méga tuile"
			price={500}
			linkText="Choisir le format méga tuile"
			formulaId="5"
			class="md:col-span-2 xl:col-span-3"
		>
			Soyons fou, une méga tuile de 50km par 50km
		</Formula>
	</div>
</main>

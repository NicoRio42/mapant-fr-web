<script lang="ts">
	import Dialog from '#lib/components/Dialog.svelte';
	import GameMap from '#lib/components/guesser/GameMap.svelte';
	import { MAPANT_TILES_BASE_URL } from '#lib/components/map/mapant-tile-url.js';
	import { findCoveredLocation, formatDistance, guessDistance } from '#lib/guesser/round.js';
	import type { Coordinate } from 'ol/coordinate.js';
	import { onMount } from 'svelte';

	let status: 'loading' | 'playing' | 'revealed' | 'error' = $state('loading');
	let target: Coordinate | undefined = $state();
	let guess: Coordinate | undefined = $state();
	let distance: number | undefined = $state();
	let error = $state('');
	let dialogOpen = $state(false);
	let resetSequence = $state(0);
	let roundId = $state(0);
	let search: AbortController | undefined;

	async function newRound() {
		search?.abort();
		const current = new AbortController();
		search = current;
		status = 'loading';
		dialogOpen = false;
		target = undefined;
		guess = undefined;
		distance = undefined;
		error = '';
		resetSequence = 0;
		try {
			const location = await findCoveredLocation({
				baseUrl: MAPANT_TILES_BASE_URL,
				signal: current.signal
			});
			if (current.signal.aborted) return;
			target = location;
			roundId += 1;
			status = 'playing';
		} catch (cause) {
			if (current.signal.aborted) return;
			error = cause instanceof Error ? cause.message : 'Impossible de charger un lieu. Réessayez.';
			status = 'error';
		}
	}

	function confirmGuess() {
		if (status !== 'playing' || !target || !guess) return;
		distance = guessDistance(target, guess);
		status = 'revealed';
	}

	onMount(() => {
		void newRound();
		return () => search?.abort();
	});
</script>

<svelte:head>
	<title>Mapant Guesser — Retrouvez votre position</title>
	<meta
		name="description"
		content="Un lieu au hasard sur Mapant.fr : explorez la carte de course d’orientation et retrouvez votre position sur OpenStreetMap."
	/>
</svelte:head>

<main class="guesser">
	<header class="game-header">
		<div>
			<h1>Mapant <strong>Guesser</strong></h1>
			<p>Un lieu en France. À vous de le retrouver.</p>
		</div>
		<button type="button" class="outline" onclick={newRound}>Nouveau lieu</button>
	</header>

	<div class="exploration">
		{#if target}
			{#key roundId}
				<GameMap mode="explore" {target} {guess} revealed={status === 'revealed'} {resetSequence} />
			{/key}
		{:else}
			<div class="placeholder" role="status" aria-live="polite">
				{#if status === 'loading'}
					<span aria-busy="true"></span>
					<h2>À la recherche d’un lieu…</h2>
					<p>Nous vérifions la couverture Mapant autour du point de départ.</p>
				{:else}
					<h2>La carte se fait attendre</h2>
					<p class="error-msg">{error}</p>
					<button type="button" onclick={newRound}>Réessayer</button>
				{/if}
			</div>
		{/if}
	</div>

	<footer class="game-footer">
		<div class="round-info" aria-live="polite">
			{#if distance !== undefined}
				<strong class="distance">{formatDistance(distance)}</strong>
				<span>entre votre choix et le point de départ</span>
			{:else}
				<strong>Où se trouve le point de départ ?</strong>
				<span>Explorez les alentours, puis placez votre choix sur la carte.</span>
			{/if}
		</div>
		<div class="actions">
			<button type="button" class="outline" disabled={!target} onclick={() => (resetSequence += 1)}
				>Retour au départ</button
			>
			<button type="button" disabled={!target} onclick={() => (dialogOpen = true)}>
				{status === 'revealed' ? 'Voir le résultat' : 'Faire une proposition'}
			</button>
		</div>
	</footer>
</main>

<Dialog bind:open={dialogOpen} maxWidth="1040px" label="Votre proposition Mapant Guesser">
	<div class="guess-dialog">
		<div class="dialog-header">
			<div>
				<h2>{status === 'revealed' ? 'Votre résultat' : 'Où êtes-vous ?'}</h2>
				<p>
					{status === 'revealed'
						? 'Départ en orange · Votre choix en bleu'
						: 'Cliquez pour placer votre choix.'}
				</p>
			</div>
			<button
				type="button"
				class="outline"
				aria-label="Fermer la carte"
				onclick={() => (dialogOpen = false)}>✕</button
			>
		</div>
		<!-- Keep the map mounted while the dialog is closed to preserve its view for this round. -->
		{#if target}
			<div class="guess-map">
				<GameMap
					mode="guess"
					{target}
					{guess}
					revealed={status === 'revealed'}
					onGuess={(point) => {
						if (status === 'playing') guess = point;
					}}
				/>
			</div>
		{/if}
		<div class="dialog-footer">
			{#if status === 'revealed' && distance !== undefined}
				<p aria-live="polite">
					<strong class="distance">{formatDistance(distance)}</strong> du point de départ
				</p>
				<button type="button" onclick={newRound}>Jouer un nouveau lieu</button>
			{:else}
				<button type="button" class="outline" onclick={() => (dialogOpen = false)}
					>Continuer à explorer</button
				>
				<button type="button" disabled={!guess || status !== 'playing'} onclick={confirmGuess}
					>Valider mon choix</button
				>
			{/if}
		</div>
	</div>
</Dialog>

<style>
	.guesser {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}
	.game-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.5rem;
	}
	.game-header button {
		flex-shrink: 0;
	}
	h1 {
		font-size: 1.5rem;
		margin: 0;
	}
	h1 strong {
		color: var(--pico-primary);
	}
	.game-header p,
	.dialog-header p {
		margin: 0.25rem 0 0;
		color: var(--pico-muted-color);
	}
	.exploration {
		position: relative;
		flex: 1;
		min-height: 250px;
	}
	.placeholder {
		height: 100%;
		min-height: 250px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		padding: 2rem;
		background: #f3f1eb;
		gap: 1rem;
	}
	.placeholder h2 {
		margin: 0;
		font-size: 1.35rem;
	}
	.placeholder p {
		max-width: 30rem;
		margin: 0;
	}
	.game-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--pico-muted-border-color);
	}
	.round-info {
		display: flex;
		flex-direction: column;
	}
	.round-info span {
		font-size: 0.85rem;
		color: var(--pico-muted-color);
	}
	.actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	button {
		margin: 0;
	}
	.distance {
		font-size: 1.5rem;
		color: var(--pico-primary);
		font-variant-numeric: tabular-nums;
	}
	.guess-dialog {
		width: 100%;
	}
	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.dialog-header h2 {
		margin: 0;
		font-size: 1.4rem;
	}
	.guess-map {
		height: min(56dvh, 550px);
		min-height: 250px;
		overflow: hidden;
		border-radius: 0.35rem;
	}
	.dialog-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1rem;
	}
	.dialog-footer p {
		margin: 0;
	}
	@media (max-width: 600px) {
		.game-header,
		.game-footer {
			padding: 0.75rem;
		}
		.actions {
			width: 100%;
		}
		.actions button:last-child {
			flex: 1;
		}
		.guess-map {
			min-height: 220px;
			height: 48dvh;
		}
		.dialog-footer button {
			flex: 1;
		}
	}
</style>

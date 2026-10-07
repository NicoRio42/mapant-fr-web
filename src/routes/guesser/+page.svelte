<script lang="ts">
	import Dialog from '#lib/components/Dialog.svelte';
	import GameMap from '#lib/components/guesser/GameMap.svelte';
	import { MAPANT_TILES_BASE_URL } from '#lib/components/map/mapant-tile-url.js';
	import { findCoveredLocation, formatDistance } from '#lib/guesser/round.js';
	import {
		createGame,
		finishRound,
		formatTime,
		MAX_GAME_POINTS,
		MAX_ROUND_POINTS,
		placeGuess,
		remainingSeconds,
		ROUND_COUNT,
		startRound,
		totalPoints,
		type RoundResult
	} from '#lib/guesser/game.js';
	import type { Coordinate } from 'ol/coordinate.js';
	import { onMount } from 'svelte';

	let game = $state(createGame());
	let now = $state(0);
	let dialogOpen = $state(false);
	let roundId = $state(0);
	let viewportWidth = $state(1024);
	let sidebarOpen = $state(false);
	let search: AbortController | undefined;
	const revealed = $derived(game.status === 'revealed' || game.status === 'finished');
	const roundNumber = $derived(Math.min(game.results.length + (revealed ? 0 : 1), ROUND_COUNT));
	const result = $derived(revealed ? game.results.at(-1) : undefined);
	const previousResults = $derived(
		game.status === 'revealed' ? game.results.slice(0, -1) : game.results
	);
	const secondsLeft = $derived(remainingSeconds(game, now));
	const score = $derived(totalPoints(game));
	const points = (value: number) => value.toLocaleString('fr-FR');

	async function loadRound() {
		search?.abort();
		const current = new AbortController();
		search = current;
		game = { status: 'loading', results: game.results };
		dialogOpen = false;
		try {
			const location = await findCoveredLocation({
				baseUrl: MAPANT_TILES_BASE_URL,
				signal: current.signal
			});
			if (current.signal.aborted) return;
			now = Date.now();
			game = startRound(game, location, now);
			roundId += 1;
		} catch (cause) {
			if (current.signal.aborted) return;
			game = {
				status: 'error',
				results: game.results,
				error: cause instanceof Error ? cause.message : 'Impossible de charger un lieu. Réessayez.'
			};
		}
	}

	function newGame() {
		game = createGame();
		void loadRound();
	}

	function nextRound() {
		if (game.status === 'revealed') void loadRound();
	}

	function updateClock() {
		now = Date.now();
		if (game.status === 'playing' && remainingSeconds(game, now) === 0) {
			game = finishRound(game, now);
			dialogOpen = true;
		}
	}

	function chooseGuess(point: Coordinate) {
		now = Date.now();
		game = placeGuess(game, point, now);
	}

	function confirmGuess() {
		now = Date.now();
		game = finishRound(game, now);
	}

	onMount(() => {
		void loadRound();
		const timer = window.setInterval(updateClock, 250);
		document.addEventListener('visibilitychange', updateClock);
		window.addEventListener('focus', updateClock);
		return () => {
			search?.abort();
			window.clearInterval(timer);
			document.removeEventListener('visibilitychange', updateClock);
			window.removeEventListener('focus', updateClock);
		};
	});
</script>

<svelte:head>
	<title>Mapant Guesser — Retrouvez votre position</title>
	<meta
		name="description"
		content="Retrouvez cinq lieux sur Mapant.fr : cinq minutes par manche, 5 000 points à moins de 50 m et un score total sur 25 000."
	/>
</svelte:head>

<svelte:window bind:innerWidth={viewportWidth} />

{#snippet timer()}
	{#if game.status === 'playing'}
		<span class="timer" class:urgent={secondsLeft <= 30} role="timer" aria-label="Temps restant">
			{formatTime(secondsLeft)}
		</span>
	{/if}
{/snippet}

{#snippet resultText(round: RoundResult | undefined = result)}
	{#if round}
		<strong class="distance">{points(round.points)} / {points(MAX_ROUND_POINTS)} points</strong>
		<span>
			{#if round.timedOut}Temps écoulé ·
			{/if}
			{round.distance === undefined
				? 'Aucune proposition'
				: `${formatDistance(round.distance)} du départ`}
		</span>
		<span>Temps : {formatTime(round.elapsedSeconds)}</span>
	{/if}
{/snippet}

<main class="guesser">
	{#if !sidebarOpen}
		<button
			type="button"
			class="sidebar-toggle secondary outline"
			bg-white
			aria-label="Afficher les commandes"
			aria-controls="game-sidebar"
			aria-expanded={sidebarOpen}
			onclick={() => (sidebarOpen = true)}
		>
			<i i-carbon-menu w-5 h-5 block aria-hidden="true"></i>
		</button>
	{/if}
	<aside
		id="game-sidebar"
		class="game-sidebar"
		aria-label="Commandes du jeu"
		hidden={viewportWidth <= 600 && !sidebarOpen}
	>
		<div class="game-heading">
			<div class="game-heading-title">
				<button
					type="button"
					class="sidebar-close secondary outline"
					bg-white
					aria-label="Fermer les commandes"
					aria-controls="game-sidebar"
					aria-expanded={sidebarOpen}
					onclick={() => (sidebarOpen = false)}
				>
					<i i-carbon-close-large w-5 h-5 block aria-hidden="true"></i>
				</button>
				<h1>Mapant <strong>Guesser</strong></h1>
			</div>
			<p>{ROUND_COUNT} manches · 5 min par manche · 5 000 points à 50 m ou moins</p>
		</div>
		<div class="progress-info" aria-live="polite">
			<strong>Score total</strong>
			<span>{points(score)} / {points(MAX_GAME_POINTS)} points</span>
		</div>
		<div class="sidebar-round">
			{#each previousResults as round, index}
				<div class="round-info sidebar-result">
					<strong>Manche {index + 1}</strong>
					{@render resultText(round)}
				</div>
			{/each}
			{#if game.status !== 'finished'}
				<div class="game-stats">
					<div class="progress-info" aria-live="polite">
						<strong>Manche {roundNumber} / {ROUND_COUNT}</strong>
					</div>
					{@render timer()}
				</div>
				{#if result}
					<div class="round-info" aria-live="polite">{@render resultText()}</div>
				{/if}
			{/if}
			{#if game.status === 'finished'}
				<div class="round-info" aria-live="polite">
					<span>Partie terminée ! Retrouvez le détail des cinq manches dans le bilan.</span>
				</div>
			{/if}
			{#if game.status === 'revealed'}
				<div class="actions">
					<button type="button" onclick={nextRound}>Manche suivante</button>
				</div>
			{/if}
		</div>
		<div class="sidebar-footer">
			{#if !revealed}
				<div class="round-info">
					<strong>Où se trouve le point de départ ?</strong>
					<span>À la fin du chrono, votre choix est validé. Sans choix : 0 point.</span>
				</div>
			{/if}
			<button type="button" class="outline" onclick={newGame}>Nouvelle partie</button>
		</div>
	</aside>

	<div class="exploration">
		{#if game.target}
			{#key roundId}
				<GameMap mode="explore" target={game.target} guess={game.guess} {revealed} />
			{/key}
		{:else}
			<div class="placeholder" role="status" aria-live="polite">
				{#if game.status === 'loading'}
					<span aria-busy="true"></span>
					<h2>À la recherche d’un lieu…</h2>
					<p>
						Nous vérifions la couverture Mapant autour du point de départ. Le chrono démarre
						ensuite.
					</p>
				{:else}
					<h2>La carte se fait attendre</h2>
					<p class="error-msg">{game.error}</p>
					<button type="button" onclick={loadRound}>Réessayer</button>
				{/if}
			</div>
		{/if}
		{#if viewportWidth <= 600 && game.status === 'playing'}
			<div class="map-timer">
				{@render timer()}
			</div>
		{/if}
		<button
			type="button"
			class="guess-button"
			disabled={!game.target}
			aria-haspopup="dialog"
			onclick={() => (dialogOpen = true)}
		>
			<span>
				{game.status === 'finished'
					? 'Voir le bilan'
					: revealed
						? 'Voir le résultat'
						: 'Faire une proposition'}
			</span>
		</button>
	</div>
</main>

<Dialog bind:open={dialogOpen} maxWidth="1040px" label="Votre proposition Mapant Guesser">
	<div class="guess-dialog">
		<div class="dialog-header">
			<div>
				<h2>
					{game.status === 'finished'
						? 'Partie terminée !'
						: revealed
							? `Résultat de la manche ${roundNumber}`
							: `Manche ${roundNumber} — Où êtes-vous ?`}
				</h2>
				<p>
					{revealed ? 'Départ en orange · Votre choix en bleu' : 'Cliquez pour placer votre choix.'}
				</p>
			</div>
			{@render timer()}
			<button
				type="button"
				class="outline"
				aria-label="Fermer la carte"
				onclick={() => (dialogOpen = false)}>✕</button
			>
		</div>
		{#if game.status === 'finished'}
			<div class="game-summary" aria-live="polite">
				<p class="final-score">
					<strong>{points(score)}</strong> / {points(MAX_GAME_POINTS)} points
				</p>
				<table>
					<caption>Vos cinq manches</caption>
					<thead
						><tr
							><th scope="col">Manche</th><th scope="col">Distance</th><th scope="col">Temps</th><th
								scope="col">Points</th
							></tr
						></thead
					>
					<tbody>
						{#each game.results as round, index}
							<tr>
								<th scope="row">{index + 1}{round.timedOut ? ' · Temps écoulé' : ''}</th>
								<td
									>{round.distance === undefined
										? 'Sans choix'
										: formatDistance(round.distance)}</td
								>
								<td>{formatTime(round.elapsedSeconds)}</td>
								<td>{points(round.points)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
		<!-- Keep the map mounted while the dialog is closed to preserve its view for this round. -->
		{#if game.target}
			<div class="guess-map" class:final-map={game.status === 'finished'}>
				<GameMap
					mode="guess"
					target={game.target}
					guess={game.guess}
					{revealed}
					onGuess={chooseGuess}
				/>
			</div>
		{/if}
		<div class="dialog-footer">
			{#if revealed}
				<div class="round-info" aria-live="polite">{@render resultText()}</div>
				{#if game.status === 'finished'}
					<button type="button" onclick={newGame}>Rejouer une partie</button>
				{:else}
					<button type="button" onclick={nextRound}>Manche suivante</button>
				{/if}
			{:else}
				<button type="button" class="outline" onclick={() => (dialogOpen = false)}
					>Continuer à explorer</button
				>
				<button
					type="button"
					disabled={!game.guess || game.status !== 'playing'}
					onclick={confirmGuess}>Valider mon choix</button
				>
			{/if}
		</div>
	</div>
</Dialog>

<style>
	.guesser {
		position: relative;
		display: flex;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
	.game-sidebar {
		display: flex;
		flex-direction: column;
		flex: 0 0 20rem;
		gap: 1.5rem;
		padding: 1.5rem;
		overflow-y: auto;
		background: var(--pico-background-color);
		border-right: 1px solid var(--pico-muted-border-color);
	}
	.game-sidebar[hidden] {
		display: none;
	}
	.sidebar-toggle,
	.sidebar-close {
		display: none;
	}
	.game-stats {
		display: flex;
		align-items: center;
		gap: 1rem;
		justify-content: space-between;
		padding: 1rem 0;
		border-block: 1px solid var(--pico-muted-border-color);
	}
	.progress-info {
		display: flex;
		flex-direction: column;
		font-variant-numeric: tabular-nums;
	}
	.progress-info span {
		font-size: 0.85rem;
		color: var(--pico-muted-color);
	}
	.timer {
		font-size: 1.5rem;
		font-weight: bold;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.timer.urgent {
		color: #b42318;
	}
	h1 {
		font-size: 1.5rem;
		margin: 0;
	}
	h1 strong {
		color: var(--pico-primary);
	}
	.game-heading p,
	.dialog-header p {
		margin: 0.25rem 0 0;
		color: var(--pico-muted-color);
	}
	.exploration {
		position: relative;
		flex: 1;
		min-width: 0;
		min-height: 250px;
	}
	.guess-button {
		position: absolute;
		right: 0.75rem;
		bottom: 2rem;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 7rem;
		aspect-ratio: 1;
		padding: 0.5rem;
		border: 2px solid white;
		border-radius: 0.35rem;
		background: #f3f1eb url('/images/guesser-osm-preview.png') center / cover;
		box-shadow: 0 2px 8px rgb(0 0 0 / 25%);
		color: #343b44;
		font-size: 0.8rem;
		font-weight: 600;
		line-height: 1.3;
		text-align: center;
	}
	.guess-button span {
		padding: 0.35rem 0.5rem;
		border-radius: 0.2rem;
		background: rgb(255 255 255 / 92%);
	}
	.guess-button:not(:disabled):hover {
		border-color: var(--pico-primary);
	}
	.guess-button:focus-visible {
		outline: 3px solid var(--pico-primary);
		outline-offset: 3px;
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
	.sidebar-round {
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		gap: 1rem;
	}
	.sidebar-result {
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--pico-muted-border-color);
	}
	.sidebar-result .distance {
		font-size: 1rem;
		color: inherit;
	}
	.sidebar-result + .game-stats {
		border-top: 0;
	}
	.sidebar-footer {
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		gap: 1rem;
		margin-top: auto;
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
	.game-summary table {
		font-size: 0.9rem;
	}
	.game-summary caption {
		text-align: left;
		color: var(--pico-muted-color);
	}
	.final-score {
		margin: 0 0 1rem;
		font-size: 1.5rem;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
	.final-score strong {
		color: var(--pico-primary);
		font-size: 2rem;
	}
	.guess-map.final-map {
		height: 28dvh;
		min-height: 220px;
	}
	@media (max-width: 600px) {
		.game-sidebar {
			position: absolute;
			inset: 0 auto 0 0;
			/* The open sidebar must still cover the map markers. */
			z-index: 5;
			width: min(20rem, calc(100% - 3.5rem));
			padding: 1rem;
			box-shadow: 4px 0 16px rgb(0 0 0 / 15%);
		}
		.sidebar-toggle,
		.sidebar-close {
			display: grid;
			place-items: center;
			width: 2.75rem;
			height: 2.75rem;
			padding: 0;
			flex-shrink: 0;
		}
		.sidebar-toggle {
			position: absolute;
			top: 0.75rem;
			left: 0.75rem;
			z-index: 3;
		}
		.game-heading-title {
			display: flex;
			align-items: center;
			gap: 0.75rem;
		}
		.game-heading p {
			font-size: 0.85rem;
		}
		.map-timer {
			position: absolute;
			top: 0.75rem;
			right: 0.75rem;
			z-index: 1;
			display: flex;
			align-items: center;
			height: 2.75rem;
			padding: 0 0.75rem;
			border: 1px solid var(--pico-muted-border-color);
			border-radius: var(--pico-border-radius);
			background: white;
			color: #343b44;
			box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
			pointer-events: none;
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

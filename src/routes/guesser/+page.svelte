<script lang="ts">
	import Account from '#lib/components/guesser/Account.svelte';
	import { formatTime } from '#lib/guesser/game.js';
	import type { Leader } from '#lib/guesser/protocol.js';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const points = (value: number) => value.toLocaleString('fr-FR');
	const time = (milliseconds: number) => formatTime(Math.floor(milliseconds / 1000));
</script>

<svelte:head>
	<title>Mapant Guesser — Classement et jeu</title>
	<meta
		name="description"
		content="Retrouvez cinq lieux en France sur Mapant. Jouez sans compte et publiez votre meilleur score au classement Mapant Guesser."
	/>
</svelte:head>

{#snippet rank(position: number)}
	{#if position <= 3}
		<span class="medal" role="img" aria-label={`${position === 1 ? '1re' : `${position}e`} place`}>
			{position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
		</span>
	{:else}
		<span class="rank-number">{position}</span>
	{/if}
{/snippet}

{#snippet row(player: Leader)}
	<tr class:current-player={player.gameId === data.current?.gameId}>
		<td class="rank">{@render rank(player.rank)}</td>
		<th scope="row" class="player">
			{player.pseudonym}
			{#if player.gameId === data.current?.gameId}<span class="you">Vous</span>{/if}
		</th>
		<td class="numeric score">{points(player.points)}</td>
		<td class="numeric time">{time(player.time)}</td>
	</tr>
{/snippet}

<main class="landing">
	<div class="content">
		<header class="hero">
			<h1>Mapant Guesser</h1>
			<ul class="game-facts" aria-label="Les règles en bref">
				<li><strong>5</strong> manches</li>
				<li><strong>5 min</strong> par manche</li>
				<li><strong>25 000</strong> points possibles</li>
			</ul>
			<a class="play big" href="/guesser/game" role="button">
				Jouer ou reprendre <i class="i-carbon-arrow-right" aria-hidden="true"></i>
			</a>
		</header>

		<Account user={data.user} />

		<section class="leaderboard" aria-labelledby="leaderboard-title">
			<div class="section-heading">
				<div>
					<h2 id="leaderboard-title">Classement</h2>
				</div>
				<span class="top-label">Top 100</span>
			</div>

			{#if data.current}
				<aside class="personal-best" aria-label="Votre meilleur score">
					<div class="personal-title">
						<i class="i-carbon-trophy" aria-hidden="true"></i><strong>Votre record</strong>
					</div>
					<dl>
						<div>
							<dt>Rang</dt>
							<dd>#{data.current.rank}</dd>
						</div>
						<div>
							<dt>Points</dt>
							<dd>{points(data.current.points)}</dd>
						</div>
						<div>
							<dt>Temps</dt>
							<dd>{time(data.current.time)}</dd>
						</div>
					</dl>
				</aside>
			{/if}

			{#if data.error}
				<div class="empty-state">
					<p role="alert">{data.error}</p>
					<a href="/guesser" data-sveltekit-reload>Réessayer</a>
				</div>
			{:else if !data.leaders.length}
				<div class="empty-state">
					<i class="i-carbon-trophy" aria-hidden="true"></i>
					<h3>La première place vous attend</h3>
					<p>Terminez une partie et publiez votre score pour ouvrir le classement.</p>
					<a href="/guesser/game">À vous de jouer →</a>
				</div>
			{:else}
				<div class="scores">
					<table>
						<caption class="sr-only">Les 100 meilleurs joueurs de Mapant Guesser</caption>
						<thead
							><tr
								><th scope="col" class="rank">Rang</th><th scope="col">Joueur</th><th
									scope="col"
									class="numeric">Points</th
								><th scope="col" class="numeric">Temps</th></tr
							></thead
						>
						<tbody
							>{#each data.leaders as player (player.gameId)}{@render row(player)}{/each}</tbody
						>
					</table>
				</div>
			{/if}
		</section>
	</div>
</main>

<style>
	.landing {
		flex: 1;
		min-height: 0;
		overflow: auto;
		padding: 1.75rem 1.25rem 3rem;
	}
	.content {
		width: 100%;
		max-width: 52rem;
		margin-inline: auto;
	}
	.hero {
		padding-block: 0 1.5rem;
		text-align: center;
	}
	.eyebrow {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		color: var(--pico-primary);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		margin-bottom: 0.75rem;
	}
	i {
		display: inline-block;
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}
	h1 {
		margin-top: 0;
		font-size: clamp(2rem, 5vw, 2.6rem);
		font-weight: 700;
		letter-spacing: -0.04em;
		margin-bottom: 0.75rem;
	}
	.intro {
		max-width: 35rem;
		margin: 0 auto;
		color: var(--pico-muted-color);
		line-height: 1.6;
	}
	.game-facts {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem 1.5rem;
		padding: 0;
		margin: 1.5rem 0 1rem;
		font-size: 0.85rem;
		color: var(--pico-muted-color);
	}
	.game-facts li {
		list-style: none;
		margin: 0;
	}
	.game-facts strong {
		color: var(--pico-color);
	}
	.play {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 0.8rem 1.5rem;
		border-radius: 0.65rem;
		font-weight: 600;
	}
	.free-play {
		font-size: 0.8rem;
		color: var(--pico-muted-color);
		margin: 0.65rem 0 0;
	}
	.leaderboard {
		margin-top: 2rem;
	}
	.section-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}
	h2 {
		margin-top: 0;
		font-size: 1.4rem;
		font-weight: 650;
		letter-spacing: -0.02em;
		margin-bottom: 0.3rem;
	}
	.section-heading p {
		font-size: 0.85rem;
		color: var(--pico-muted-color);
		margin: 0;
	}
	.top-label {
		white-space: nowrap;
		color: var(--pico-muted-color);
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.3rem 0.7rem;
		border: 1px solid var(--pico-muted-border-color);
		border-radius: 2rem;
	}
	.scores {
		overflow-x: auto;
		border: 1px solid var(--pico-muted-border-color);
		border-radius: 0.75rem;
	}
	table {
		width: 100%;
		margin: 0;
		font-size: 0.95rem;
	}
	th,
	td {
		padding: 1rem 1.25rem;
		vertical-align: middle;
	}
	thead th {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--pico-muted-color);
		background: var(--pico-card-sectioning-background-color);
	}
	tbody tr:last-child > * {
		border-bottom: 0;
	}
	.rank {
		width: 4.5rem;
		text-align: center;
	}
	.medal {
		font-size: 1.6rem;
		line-height: 1;
	}
	.rank-number {
		color: var(--pico-muted-color);
		font-variant-numeric: tabular-nums;
	}
	.player {
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.numeric {
		text-align: right;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	.score {
		font-weight: 650;
	}
	.time {
		color: var(--pico-muted-color);
	}
	.current-player > * {
		background: color-mix(in srgb, var(--pico-primary) 7%, var(--pico-background-color));
	}
	.you {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 500;
		padding: 0.1rem 0.35rem;
		border-radius: 0.3rem;
		margin-left: 0.35rem;
		color: var(--pico-primary);
		background: color-mix(in srgb, var(--pico-primary) 10%, var(--pico-background-color));
		vertical-align: middle;
	}
	.personal-best {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		margin-bottom: 1rem;
		padding: 1.1rem 1.25rem;
		border: 1px solid color-mix(in srgb, var(--pico-primary) 30%, var(--pico-muted-border-color));
		border-radius: 0.75rem;
		background: color-mix(in srgb, var(--pico-primary) 5%, var(--pico-background-color));
	}
	.personal-title {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		font-size: 0.9rem;
	}
	.personal-title i {
		color: var(--pico-primary);
	}
	dl {
		display: flex;
		gap: 2rem;
		margin: 0;
	}
	dt {
		font-size: 0.7rem;
		color: var(--pico-muted-color);
		margin-bottom: 0.2rem;
	}
	dd {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 650;
		font-variant-numeric: tabular-nums;
	}
	.empty-state {
		padding: 2.5rem 1.5rem;
		text-align: center;
		border: 1px dashed var(--pico-muted-border-color);
		border-radius: 0.75rem;
	}
	.empty-state > i {
		color: var(--pico-primary);
		width: 2rem;
		height: 2rem;
		margin-bottom: 0.75rem;
	}
	.empty-state h3 {
		margin-top: 0;
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
	}
	.empty-state p {
		font-size: 0.9rem;
		color: var(--pico-muted-color);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	@media (max-width: 600px) {
		.landing {
			padding: 1.5rem 1rem 2.5rem;
		}
		.game-facts {
			column-gap: 1rem;
			font-size: 0.8rem;
		}
		.hero {
			padding-bottom: 1.5rem;
		}
		.leaderboard {
			margin-top: 2rem;
		}
		th,
		td {
			padding: 0.85rem 0.6rem;
		}
		table {
			font-size: 0.85rem;
		}
		.rank {
			width: 3rem;
		}
		.personal-best {
			flex-direction: column;
			align-items: stretch;
			gap: 0.9rem;
		}
		dl {
			justify-content: space-between;
			gap: 1rem;
		}
	}
</style>

<script lang="ts">
	import Account from '#lib/components/guesser/Account.svelte';
	import { formatMilliseconds, type Leader } from '#lib/guesser/protocol.js';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Mapant Guesser — Classement et jeu</title>
	<meta
		name="description"
		content="Retrouvez cinq lieux en France sur Mapant. Jouez sans compte et publiez votre meilleur score au classement Mapant Guesser."
	/>
</svelte:head>
{#snippet row(player: Leader)}
	<tr
		><th scope="row">{player.rank}</th><td>{player.pseudonym}</td><td
			>{player.points.toLocaleString('fr-FR')}</td
		><td>{formatMilliseconds(player.time)}</td><td
			>{new Date(player.date).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}</td
		></tr
	>
{/snippet}
<main class="container landing">
	<h1>Mapant Guesser</h1>
	<p>
		Retrouvez votre position sur la carte de France : cinq manches de cinq minutes, jusqu’à 5 000
		points par manche à moins de 50 mètres. Jouez sans compte.
	</p>
	<p>
		Le classement retient votre meilleure partie : points, puis temps de jeu à la milliseconde. La
		recherche des lieux et les pauses entre manches ne comptent pas.
	</p>
	<p><a href="/guesser/game" role="button">Jouer ou reprendre une partie</a></p>
	<details><summary>Compte et publication des scores</summary><Account user={data.user} /></details>
	<h2>Classement — Top 100</h2>
	{#if data.error}<p role="alert">{data.error}</p>
		<a href="/guesser" data-sveltekit-reload>Réessayer</a>
	{:else if !data.leaders.length}<p>
			Soyez le premier à terminer une partie et à publier votre score !
		</p>
	{:else}<div class="scores">
			<table>
				<thead
					><tr
						><th scope="col">Rang</th><th scope="col">Pseudo</th><th scope="col">Points</th><th
							scope="col">Temps</th
						><th scope="col">Date</th></tr
					></thead
				><tbody
					>{#each data.leaders as player}{@render row(player)}{/each}</tbody
				>
			</table>
		</div>{/if}
	{#if data.current}<h2>Votre meilleur score</h2>
		<p>
			Rang {data.current.rank} · {data.current.points.toLocaleString('fr-FR')} points · {formatMilliseconds(
				data.current.time
			)} · {new Date(data.current.date).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}
		</p>{/if}
</main>

<style>
	.landing {
		padding-block: 2rem;
		overflow: auto;
	}
	.scores {
		overflow-x: auto;
	}
	td {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>

<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { api, readDraft, writeDraft } from '#lib/guesser/client.js';
	import type { SafeUser } from '#lib/guesser/protocol.js';
	let {
		user,
		onlogout = () => {}
	}: {
		user: SafeUser | null;
		onlogout?: () => void;
	} = $props();
	let busy = $state(false);
	let message = $state('');
	async function logout() {
		busy = true;
		message = '';
		try {
			await api('auth/logout', {});
			if (readDraft()?.userId) writeDraft(null);
			onlogout();
			await invalidateAll();
		} catch (cause) {
			message = cause instanceof Error ? cause.message : 'Déconnexion impossible. Réessayez.';
		} finally {
			busy = false;
		}
	}
</script>

<section class="account" aria-label="Compte joueur">
	{#if user}
		<p>Connecté : <strong>{user.pseudonym}</strong></p>
		<button class="outline" disabled={busy} aria-busy={busy} onclick={logout}>Se déconnecter</button
		>
	{:else}
		<p>
			Jouez librement. Pour publier votre score, connectez-vous : votre pseudo et votre meilleur
			score seront publics. Votre e-mail sert à vous authentifier.
		</p>
		<a
			href={`/login?returnTo=${encodeURIComponent(page.url.pathname + page.url.search)}`}
			role="button"
		>
			Se connecter ou s’inscrire
		</a>
	{/if}
	{#if message}<p role="alert">{message}</p>{/if}
</section>

<style>
	.account {
		max-width: 36rem;
	}
	p {
		font-size: 0.9rem;
	}
</style>

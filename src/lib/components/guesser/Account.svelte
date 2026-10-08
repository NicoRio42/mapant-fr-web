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
	<div class="account-content">
		<span class="avatar" aria-hidden="true"><i class="i-carbon-user-avatar"></i></span>
		<div class="identity">
			{#if user}
				<span class="account-label">Votre compte</span>
				<strong class="pseudonym">{user.pseudonym}</strong>
			{:else}
				<strong>Faites votre place au classement</strong>
				<p>Connectez-vous pour publier votre meilleur score sous votre pseudo.</p>
			{/if}
		</div>
		{#if user}
			<button class="outline account-action" disabled={busy} aria-busy={busy} onclick={logout}
				>Se déconnecter</button
			>
		{:else}
			<a
				class="outline account-action"
				href={`/login?returnTo=${encodeURIComponent(page.url.pathname + page.url.search)}`}
				role="button">Se connecter ou s’inscrire</a
			>
		{/if}
	</div>
	{#if message}<p class="error" role="alert">{message}</p>{/if}
</section>

<style>
	.account {
		padding: 1.15rem 1.25rem;
		border: 1px solid var(--pico-muted-border-color);
		border-radius: 0.75rem;
		background: var(--pico-card-background-color);
	}
	.account-content {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		flex-wrap: wrap;
	}
	.avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 50%;
		flex-shrink: 0;
		color: var(--pico-primary);
		background: color-mix(in srgb, var(--pico-primary) 8%, var(--pico-background-color));
	}
	.avatar i {
		display: block;
		width: 1.65rem;
		height: 1.65rem;
	}
	.identity {
		flex: 1;
		min-width: 0;
		font-size: 0.9rem;
	}
	.identity strong {
		display: block;
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.account-label {
		display: block;
		font-size: 0.75rem;
		color: var(--pico-muted-color);
		margin-bottom: 0.15rem;
	}
	.pseudonym {
		font-size: 1rem;
	}
	p {
		color: var(--pico-muted-color);
		font-size: 0.8rem;
		margin: 0.3rem 0 0;
		line-height: 1.5;
	}
	.account-action {
		font-size: 0.8rem;
		white-space: nowrap;
		margin: 0;
		padding: 0.55rem 0.8rem;
		border-radius: 0.5rem;
	}
	.error {
		color: var(--pico-del-color);
		margin-top: 0.75rem;
	}
	@media (max-width: 600px) {
		.account {
			padding: 1rem;
		}
		.account-action {
			width: 100%;
		}
	}
</style>

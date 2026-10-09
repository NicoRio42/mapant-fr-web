<script lang="ts">
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import Account from '#lib/components/guesser/Account.svelte';
	import { api } from '#lib/guesser/client.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let email = $state('');
	let pseudonym = $state('');
	let code = $state('');
	let step = $state<'email' | 'pseudonym' | 'code' | 'verified-pseudonym'>('email');
	let busy = $state(false);
	let message = $state('');
	let failed = $state(false);
	let form = $state<HTMLFormElement>();

	async function focusInput() {
		await tick();
		form?.querySelector('input')?.focus();
	}
	async function act(resend = false) {
		if (busy) return;
		busy = true;
		failed = false;
		message = '';
		try {
			if (resend || step === 'email' || step === 'pseudonym') {
				const result = await api<{ needsPseudonym?: boolean; message?: string }>('auth/send', {
					email,
					pseudonym: step === 'email' ? undefined : pseudonym
				});
				code = '';
				step = result.needsPseudonym ? 'pseudonym' : 'code';
				message = result.needsPseudonym
					? 'Choisissez un pseudo pour créer votre compte.'
					: result.message || '';
			} else {
				const result = await api<{ needsPseudonym?: boolean; message?: string }>('auth/verify', {
					code,
					pseudonym: step === 'verified-pseudonym' ? pseudonym : undefined
				});
				if (result.needsPseudonym) {
					step = 'verified-pseudonym';
					message = result.message || 'Adresse vérifiée. Choisissez un pseudo pour votre compte.';
				} else {
					await goto(data.returnTo, { refreshAll: true, replace: true });
					return;
				}
			}
		} catch (cause) {
			failed = true;
			message = cause instanceof Error ? cause.message : 'Connexion impossible. Réessayez.';
		} finally {
			busy = false;
		}
		await focusInput();
	}
</script>

<svelte:head>
	<title>Connexion ou inscription — Mapant Guesser</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="container login">
	<a href={data.returnTo}>← Retour au Guesser</a>
	<h1>Se connecter ou s’inscrire</h1>
	{#if data.user}
		<Account user={data.user} />
		<p><a href={data.returnTo} role="button">Continuer vers le Guesser</a></p>
	{:else}
		<p>Un code par e-mail suffit. Aucun mot de passe à retenir.</p>
		{#if step !== 'email' && email}<p>Adresse e-mail : <strong>{email}</strong></p>{/if}
		<form
			bind:this={form}
			onsubmit={(event) => {
				event.preventDefault();
				void act();
			}}
		>
			{#if step === 'email'}
				<label for="email">E-mail</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					autocomplete="email"
					maxlength="254"
					disabled={busy}
				/>
			{:else if step === 'pseudonym' || step === 'verified-pseudonym'}
				<label for="pseudonym">Pseudo</label>
				<input
					id="pseudonym"
					bind:value={pseudonym}
					required
					minlength="3"
					maxlength="24"
					autocomplete="nickname"
					aria-describedby="pseudo-help"
					disabled={busy}
				/>
				<p id="pseudo-help">
					De 3 à 24 caractères : lettres, chiffres, espaces, tirets ou underscores. Votre pseudo et
					votre meilleur score seront publics.
				</p>
			{:else}
				<label for="code">Code reçu par e-mail</label>
				<input
					id="code"
					bind:value={code}
					required
					inputmode="numeric"
					pattern={'[0-9]{6}'}
					maxlength="6"
					autocomplete="one-time-code"
					aria-describedby="code-help"
					disabled={busy}
				/>
				<p id="code-help">
					Six chiffres, valables 10 minutes. Après cinq essais, demandez un nouveau code.
				</p>
			{/if}
			{#if message}<p role={failed ? 'alert' : 'status'}>{message}</p>{/if}
			<button type="submit" disabled={busy} aria-busy={busy}>
				{step === 'email'
					? 'Continuer'
					: step === 'pseudonym'
						? 'Recevoir un code'
						: step === 'code'
							? 'Se connecter'
							: 'Enregistrer le pseudo'}
			</button>
			{#if step === 'code' && email}
				<button type="button" class="outline" disabled={busy} onclick={() => act(true)}
					>Renvoyer le code (après 60 s)</button
				>
			{/if}
			{#if step === 'email'}
				<button
					type="button"
					class="outline"
					disabled={busy}
					onclick={async () => {
						step = 'code';
						message = '';
						failed = false;
						await focusInput();
					}}>J’ai déjà reçu un code</button
				>
			{/if}
		</form>
		<p class="privacy">
			Votre e-mail sert à vous authentifier et à vous prévenir si vous perdez la première place du
			classement Mapant Guesser.
		</p>
	{/if}
</main>

<style>
	.login {
		max-width: 32rem;
		padding-block: 2rem;
		overflow: auto;
	}
	h1 {
		margin-top: 1.5rem;
	}
	form {
		display: grid;
		gap: 0.5rem;
	}
	input {
		min-width: 0;
	}
	form p,
	.privacy {
		font-size: 0.9rem;
	}
</style>

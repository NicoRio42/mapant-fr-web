<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api, readDraft, writeDraft } from '#lib/guesser/client.js';
	import type { SafeUser } from '#lib/guesser/protocol.js';
	let {
		user,
		onauthenticated = async () => {},
		onlogout = () => {}
	}: {
		user: SafeUser | null;
		onauthenticated?: () => Promise<void>;
		onlogout?: () => void;
	} = $props();
	let intent = $state('signup');
	let email = $state('');
	let pseudonym = $state('');
	let code = $state('');
	let step = $state('send');
	let busy = $state(false);
	let message = $state('');
	let failed = $state(false);
	async function act(action: string) {
		busy = true;
		message = '';
		failed = false;
		try {
			if (action === 'logout') {
				await api('auth/logout', {});
				if (readDraft()?.userId) writeDraft(null);
				onlogout();
				await invalidateAll();
			} else if (action === 'send') {
				const result = await api<{ message: string }>('auth/send', { intent, email, pseudonym });
				message = result.message;
				step = 'verify';
			} else {
				const result = await api<{ needsPseudonym?: boolean; message?: string }>('auth/verify', {
					code,
					pseudonym: step === 'pseudonym' ? pseudonym : undefined
				});
				if (result.needsPseudonym) {
					step = 'pseudonym';
					message =
						result.message || 'Adresse vérifiée. Choisissez un pseudo pour créer votre compte.';
				} else {
					code = '';
					await invalidateAll();
					await onauthenticated();
				}
			}
		} catch (cause) {
			failed = true;
			message =
				cause instanceof Error
					? cause.message
					: 'Connexion impossible. Votre partie est conservée.';
		} finally {
			busy = false;
		}
	}
</script>

<section class="account" aria-label="Compte joueur">
	{#if user}
		<p>Connecté : <strong>{user.pseudonym}</strong></p>
		<button class="outline" disabled={busy} onclick={() => act('logout')}>Se déconnecter</button>
	{:else}
		<p>
			Jouez librement. Pour publier votre score, connectez-vous : votre pseudo et votre meilleur
			score seront publics. Votre e-mail sert à vous authentifier.
		</p>
		<form
			onsubmit={(event) => {
				event.preventDefault();
				void act(step === 'send' ? 'send' : 'verify');
			}}
		>
			{#if step === 'send'}
				<label
					>Compte <select bind:value={intent}
						><option value="signup">Créer un compte</option><option value="login"
							>Se connecter</option
						></select
					></label
				>
				{#if intent === 'signup'}<label
						>Pseudo <input
							bind:value={pseudonym}
							required
							minlength="3"
							maxlength="24"
							autocomplete="nickname"
						/></label
					>{/if}
				<label
					>E-mail <input
						type="email"
						bind:value={email}
						required
						autocomplete="email"
						maxlength="254"
					/></label
				>
			{:else if step === 'verify'}
				<label
					>Code reçu par e-mail <input
						bind:value={code}
						required
						inputmode="numeric"
						pattern={'[0-9]{6}'}
						maxlength="6"
						autocomplete="one-time-code"
						aria-describedby="code-help"
					/></label
				>
				<p id="code-help">
					Six chiffres, valables 10 minutes. Après cinq essais, demandez un nouveau code.
				</p>
			{:else}
				<label
					>Pseudo <input
						bind:value={pseudonym}
						required
						minlength="3"
						maxlength="24"
						autocomplete="nickname"
					/></label
				>
			{/if}
			<button disabled={busy} aria-busy={busy}
				>{step === 'send'
					? 'Recevoir un code'
					: step === 'verify'
						? 'Vérifier le code'
						: 'Enregistrer le pseudo'}</button
			>
			{#if step === 'verify'}
				<button type="button" class="outline" disabled={busy} onclick={() => act('send')}
					>Renvoyer le code (après 60 s)</button
				>
			{/if}
			{#if step !== 'send'}<button
					type="button"
					class="outline"
					disabled={busy}
					onclick={() => {
						step = 'send';
						code = '';
					}}>Changer d’adresse</button
				>{/if}
		</form>
		{#if step === 'send'}<button class="outline" disabled={busy} onclick={() => (step = 'verify')}
				>J’ai déjà reçu un code</button
			>{/if}
	{/if}
	{#if message}<p role={failed ? 'alert' : 'status'}>{message}</p>{/if}
</section>

<style>
	.account {
		max-width: 36rem;
	}
	form {
		display: grid;
		gap: 0.5rem;
	}
	button {
		margin-bottom: 0.5rem;
	}
	p {
		font-size: 0.9rem;
	}
</style>

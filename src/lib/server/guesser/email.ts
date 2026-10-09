import { GuesserError, type GuesserEnv } from './db.js';
export function verificationEmail(code: string) {
	const subject = 'Votre code Mapant Guesser';
	const text = `Votre code de connexion Mapant Guesser : ${code}\n\nCe code expire dans 10 minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.`;
	return {
		subject,
		text,
		html: `<p>Votre code de connexion Mapant Guesser : <strong>${code}</strong></p><p>Ce code expire dans 10 minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.</p>`
	};
}
export async function sendCode(env: GuesserEnv, local: boolean, email: string, code: string) {
	const message = verificationEmail(code);
	try {
		await sendEmail(env, local, email, message);
	} catch (cause) {
		if (cause instanceof GuesserError) throw cause;
		throw new GuesserError(503, 'L’envoi du code a échoué. Votre partie est conservée. Réessayez.');
	}
}
export function leaderboardEmail(challenger: string) {
	const escaped = challenger.replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
	);
	return {
		subject: 'Votre première place Mapant Guesser a été dépassée !',
		text: `${challenger} a battu votre meilleur score au classement Mapant Guesser. Vous n’êtes plus à la première place.\n\nÀ vous de jouer pour la reprendre !\nhttps://mapant.fr/guesser`,
		html: `<p><strong>${escaped}</strong> a battu votre meilleur score au classement Mapant Guesser. Vous n’êtes plus à la première place.</p><p><a href="https://mapant.fr/guesser">À vous de jouer pour la reprendre !</a></p>`
	};
}
export async function sendEmail(
	env: GuesserEnv,
	local: boolean,
	email: string,
	message: { subject: string; text: string; html: string }
) {
	if (env.EMAIL_MODE === 'console' && local) {
		console.info(
			`[Mapant Guesser — e-mail local]\nÀ : ${email}\nObjet : ${message.subject}\n${message.text}`
		);
		return;
	}
	if (env.EMAIL_MODE !== 'cloudflare' || !env.EMAIL || !env.EMAIL_FROM)
		throw new GuesserError(503, 'Le service e-mail est mal configuré. Votre partie est conservée.');
	await env.EMAIL.send({ to: email, from: env.EMAIL_FROM, ...message });
}

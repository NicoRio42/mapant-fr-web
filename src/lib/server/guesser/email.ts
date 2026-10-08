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
	if (env.EMAIL_MODE === 'console' && local) {
		console.info(
			`[Mapant Guesser — e-mail local]\nÀ : ${email}\nObjet : ${message.subject}\n${message.text}`
		);
		return;
	}
	if (env.EMAIL_MODE !== 'cloudflare' || !env.EMAIL || !env.EMAIL_FROM)
		throw new GuesserError(503, 'Le service e-mail est mal configuré. Votre partie est conservée.');
	try {
		await env.EMAIL.send({ to: email, from: env.EMAIL_FROM, ...message });
	} catch {
		throw new GuesserError(
			503,
			'L’envoi du code a échoué. Votre partie est conservée. Réessayez dans une minute.'
		);
	}
}

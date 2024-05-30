import { dev } from '$app/environment';
import { DKIM_PRIVATE_KEY } from '$env/static/private';

export async function sendEmail(
	subject: string,
	htmlContent: string,
	recipientEmailAdress: string
) {
	if (dev) {
		console.log(`Email sent to ${recipientEmailAdress}
    subject: ${subject}
    ${htmlContent}`);
		return;
	}

	const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			personalizations: [
				{
					to: [{ email: recipientEmailAdress }],
					dkim_domain: 'mapant.fr',
					dkim_selector: 'mailchannels',
					dkim_private_key: DKIM_PRIVATE_KEY
				}
			],
			from: {
				email: 'contact@mapant.fr',
				name: 'Mapant.fr'
			},
			subject,
			content: [
				{
					type: 'text/html',
					value: htmlContent
				}
			]
		})
	});

	if (!response.ok) {
		throw new Error(
			`[MAILCHANNELS] ${response.status}, ${response.statusText}\n${await response.text()}`
		);
	} else {
		console.log(
			`[MAILCHANNELS] ${response.status}, ${response.statusText}\n${await response.text()}`
		);
	}
}

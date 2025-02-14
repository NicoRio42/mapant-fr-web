import { STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { getDb } from '$lib/server/db.js';
import { sendEmail } from '$lib/server/email.js';
import {
	contributionTable,
	contributionWithoutCompensationTable,
	userTable
} from '$lib/server/schema.js';
import { eq, or } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_API_KEY);

export async function POST({ request }) {
	const sig = request.headers.get('stripe-signature');

	if (sig === null) {
		console.error('[STRIPE_WEBHOOK] No stripe-signature header');
		return new Response(null, { status: 400 });
	}

	let event: Stripe.Event;

	try {
		event = await stripe.webhooks.constructEventAsync(
			await request.text(),
			sig,
			STRIPE_WEBHOOK_SECRET
		);
	} catch (err) {
		console.error(`[STRIPE_WEBHOOK] ${(err as any).message}`);
		return new Response(null, { status: 400 });
	}

	if (event.type !== 'checkout.session.completed') return new Response(null, { status: 400 });

	if (event.data.object.client_reference_id === null) {
		console.error('[STRIPE_WEBHOOK] client_reference_id not defined.');
		return new Response(null, { status: 400 });
	}

	const email = event.data.object.customer_details?.email ?? event.data.object.customer_email;

	const db = getDb();

	const [contribution] = await db
		.update(contributionTable)
		.set({ paied: true, paiedAt: new Date(), email })
		.where(eq(contributionTable.id, event.data.object.client_reference_id))
		.returning();

	const [contributionWithoutCompensation] = await db
		.update(contributionWithoutCompensationTable)
		.set({ paied: true, paiedAt: new Date(), email })
		.where(eq(contributionWithoutCompensationTable.id, event.data.object.client_reference_id))
		.returning();

	if (contribution === undefined && contributionWithoutCompensation === undefined) {
		console.error('[STRIPE_WEBHOOK] No contribution matches the given client_reference_id.');
	}

	if (email !== null) {
		await sendEmail(
			'Merci !',
			'Merci pour votre contribution au développement de Mapant.fr !',
			email
		);
	}

	return new Response(null, { status: 200 });
}

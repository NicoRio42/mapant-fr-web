import { STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { db } from '$lib/server/db.js';
import { contributionTable } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
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

	if (event.type !== 'checkout.session.completed') return;

	if (event.data.object.client_reference_id === null) {
		console.error('[STRIPE_WEBHOOK] client_reference_id not defined.');
		return new Response(null, { status: 400 });
	}

	console.log('client_reference_id', event.data.object.client_reference_id);

	const [contribution] = await db
		.update(contributionTable)
		.set({ paied: true })
		.where(eq(contributionTable.id, event.data.object.client_reference_id))
		.returning();

	if (contribution === undefined) {
		console.error('[STRIPE_WEBHOOK] No contribution matches the given client_reference_id.');
	}

	return new Response(null, { status: 200 });
}

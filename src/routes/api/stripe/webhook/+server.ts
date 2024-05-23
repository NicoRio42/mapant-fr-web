import { error } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { db } from '$lib/server/db.js';
import { contributionTable } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(STRIPE_API_KEY);

export async function POST({ request }) {
	const sig = request.headers.get('stripe-signature');
	if (sig === null) {
		console.error('[STRIPE_WEBHOOK] No stripe-signature header');
		throw error(400, 'No signature');
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(await request.text(), sig, STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error(`[STRIPE_WEBHOOK] ${(err as any).message}`);
		throw error(400, (err as any).message);
	}

	setTimeout(async () => {
		if (event.type !== 'checkout.session.completed') return;

		if (event.data.object.client_reference_id === null) {
			console.error('client_reference_id not defined.');
			return;
		}

		const [contribution] = await db
			.update(contributionTable)
			.set({ paied: true })
			.where(eq(contributionTable.id, event.data.object.client_reference_id))
			.returning();

		if (contribution === undefined) {
			console.error('No contribution matches the given client_reference_id.');
		}
	});

	return new Response(null, { status: 200 });
}

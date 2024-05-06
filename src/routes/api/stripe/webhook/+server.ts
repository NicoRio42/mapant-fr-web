import { error } from '@sveltejs/kit';
import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_API_KEY);

export async function POST({ request }) {
	const sig = request.headers.get('stripe-signature');
	if (sig === null) throw error(400, 'No signature');

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(await request.text(), sig, STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		throw error(400, `Webhook Error: ${(err as any).message}`);
	}

	setTimeout(() => {
		if (event.type !== 'checkout.session.completed') return;
		event.data.object.client_reference_id;
		// Save in DB
	});

	return new Response(null, { status: 200 });
}

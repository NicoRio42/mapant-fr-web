import { error, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const email = formData.get('email');
		if (typeof email !== 'string') throw error(400);

		const password = formData.get('password');
		if (typeof password !== 'string') throw error(400);

		const keepInTouch = formData.get('keep-in-touch') === 'on';

		console.log(email, password, keepInTouch);

		throw redirect(302, '/contribute/step-2');
	}
};

import { z } from 'zod';

export const signUpSchema = z.object({
	email: z
		.string()
		.min(1, 'Veuillez renseigner une adresse mail')
		.email('Veuillez renseigner une adresse mail au bon format'),
	password: z
		.string()
		.min(12, 'Le mot de passe doit comporter au moins 12 caractères')
		.max(20, 'Le mot de passe doit comporter au plus 20 carractères'),
	keepInTouch: z.boolean()
});

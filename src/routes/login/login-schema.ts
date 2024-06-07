import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().min(1, 'Veuillez renseigner une adresse mail'),
	password: z.string().min(1, 'Veuillez renseigner un mot de passe')
});

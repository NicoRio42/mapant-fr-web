import { drizzle } from 'drizzle-orm/d1';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
export interface GuesserEnv {
	DB: D1Database;
	R2_BUCKET_MAPANT?: R2Bucket;
	AUTH_SECRET: string;
	EMAIL_MODE?: string;
	EMAIL_FROM?: string;
	LOCAL_TILE_URL?: string;
	EMAIL_ADDRESS_LIMIT?: string;
	EMAIL_IP_LIMIT?: string;
	EMAIL?: {
		send(message: {
			to: string;
			from: string;
			subject: string;
			text: string;
			html: string;
		}): Promise<unknown>;
	};
}
export const database = (env: Pick<GuesserEnv, 'DB'>) => drizzle(env.DB);
export type Database = ReturnType<typeof database>;
export class GuesserError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}
export const conflict = () =>
	new GuesserError(
		409,
		'Cette action a déjà été effectuée ou la partie a changé. Actualisez puis réessayez.'
	);

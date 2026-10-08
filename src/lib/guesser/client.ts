export const DRAFT_KEY = 'mapant-guesser-v1';
export interface Draft {
	version: 1;
	gameId: string;
	userId: string | null;
	roundId?: string;
	guess?: number[];
	pending?: { gameId: string; roundId: string; submissionId: string; guess: number[] | null };
}
export function readDraft(): Draft | null {
	try {
		const value = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
		return value?.version === 1 && typeof value.gameId === 'string' ? value : null;
	} catch {
		return null;
	}
}
export function writeDraft(value: Draft | null) {
	try {
		if (value) localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
		else localStorage.removeItem(DRAFT_KEY);
	} catch {
		/* Cookies and the running game still work without storage. */
	}
}
export class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
	const response = await fetch(
		`/api/guesser/${path}`,
		body === undefined
			? { cache: 'no-store' }
			: {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				}
	);
	let data;
	try {
		data = await response.json();
	} catch {
		throw new ApiError(
			response.status,
			'Réponse interrompue. Réessayez pour vérifier l’enregistrement.'
		);
	}
	if (!response.ok) throw new ApiError(response.status, data.message || 'La requête a échoué.');
	return data;
}

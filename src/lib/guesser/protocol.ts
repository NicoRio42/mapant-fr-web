export interface SafeUser {
	id: string;
	pseudonym: string;
}
export interface SavedRound {
	id: string;
	number: number;
	target: number[];
	startedAt: number;
	deadlineAt: number;
	guess?: number[];
	receivedAt?: number;
	distance?: number;
	points?: number;
	elapsedMs?: number;
	submissionId?: string;
}
export interface SavedGame {
	id: string;
	status: 'playing' | 'completed';
	rounds: SavedRound[];
	totalPoints: number;
	totalTime: number;
	serverTime: number;
	saved: boolean;
	personalBest: boolean;
	claimUntil: number | null;
	guestOwned: boolean;
}
export interface Leader {
	rank: number;
	pseudonym: string;
	points: number;
	time: number;
	date: number;
	gameId: string;
}
export const GRACE_MS = 5000;
export const SESSION_MS = 30 * 86400000;
export const CODE_MS = 600000;
export const elapsed = (start: number, receipt: number) =>
	Math.min(300000, Math.max(0, receipt - start));
export const withinDeadline = (deadline: number, receipt: number) => receipt <= deadline + GRACE_MS;
export const unexpired = (expiry: number, now: number) => expiry > now;
export function formatMilliseconds(ms: number) {
	return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
}
export function canonicalEmail(value: unknown) {
	if (typeof value !== 'string') throw new Error('Adresse e-mail invalide.');
	const email = value.trim().toLowerCase();
	if (
		email.length > 254 ||
		!/^[^\s@\x00-\x1f\x7f]+@[^\s@\x00-\x1f\x7f]+\.[^\s@\x00-\x1f\x7f]+$/u.test(email)
	)
		throw new Error('Adresse e-mail invalide.');
	return email;
}
export function canonicalPseudonym(value: unknown) {
	if (typeof value !== 'string' || /\p{C}/u.test(value)) throw new Error('Pseudo invalide.');
	const display = value.normalize('NFKC').trim();
	if (!/^[\p{L}\p{N} _-]{3,24}$/u.test(display))
		throw new Error(
			'Le pseudo doit contenir 3 à 24 lettres, chiffres, espaces, tirets ou underscores.'
		);
	return { display, key: display.toLowerCase() };
}

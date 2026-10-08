// Only return to the guesser, preserving the selected game even without local storage.
export function loginDestination(value: string | null): string {
	if (!value) return '/guesser';
	try {
		const url = new URL(value, 'https://mapant.invalid');
		if (
			url.origin === 'https://mapant.invalid' &&
			['/guesser', '/guesser/game'].includes(url.pathname)
		)
			return url.pathname + url.search;
	} catch {
		// Malformed destinations fall back to the leaderboard.
	}
	return '/guesser';
}

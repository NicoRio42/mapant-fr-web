import { describe, expect, it } from 'vitest';
import { loginDestination } from './login.js';

describe('login return destination', () => {
	it('preserves the selected game without relying on browser storage', () => {
		expect(loginDestination('/guesser/game?game=selected-game')).toBe(
			'/guesser/game?game=selected-game'
		);
		expect(loginDestination('/guesser')).toBe('/guesser');
	});
	it.each([
		null,
		'',
		'/login',
		'//example.com/guesser',
		'https://example.com/guesser/game',
		'javascript:alert(1)',
		'/\\example.com/guesser',
		'/guesser/../login',
		'http://['
	])('rejects unsafe or unrelated destinations: %s', (destination) => {
		expect(loginDestination(destination)).toBe('/guesser');
	});
});

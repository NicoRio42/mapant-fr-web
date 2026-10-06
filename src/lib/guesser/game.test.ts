import { describe, expect, it } from 'vitest';
import { fromLonLat } from 'ol/proj.js';
import {
	createGame,
	finishRound,
	formatTime,
	MAX_GAME_POINTS,
	placeGuess,
	remainingSeconds,
	ROUND_DURATION_MS,
	scoreDistance,
	startRound,
	totalPoints
} from './game.js';

const targetLonLat = [2.3522, 48.8566];
const target = fromLonLat(targetLonLat, 'EPSG:2154');
const startedAt = 1000;
const playing = () => startRound(createGame(), target, startedAt);

describe('round scoring', () => {
	it('awards full points through 50 metres and fewer points immediately beyond', () => {
		for (const distance of [0, 15, 49.999, 50]) expect(scoreDistance(distance)).toBe(5000);
		expect(scoreDistance(50.001)).toBe(4999);
	});
	it('decreases with distance, stays within bounds, and handles invalid distances', () => {
		const distances = [51, 1000, 10_000, 100_000, 500_000, 1_000_000, 20_000_000];
		const scores = distances.map(scoreDistance);
		for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
		expect(scoreDistance(100_050)).toBe(1839);
		expect(scores.at(-1)).toBe(0);
		for (const distance of [-1, NaN, Infinity]) expect(scoreDistance(distance)).toBe(0);
	});
});

describe('five-round game', () => {
	it('starts the five-minute deadline only after a location is ready', () => {
		const loading = createGame();
		expect(remainingSeconds(loading, startedAt + 900_000)).toBe(0);
		const game = startRound(loading, target, startedAt);
		expect(game.deadline).toBe(startedAt + ROUND_DURATION_MS);
		expect(remainingSeconds(game, startedAt)).toBe(300);
		expect(remainingSeconds(game, startedAt + 1)).toBe(300);
		expect(remainingSeconds(game, startedAt + 1000)).toBe(299);
		expect(remainingSeconds(game, game.deadline! - 1)).toBe(1);
		expect(remainingSeconds(game, game.deadline! + 60_000)).toBe(0);
		expect(formatTime(300)).toBe('5:00');
		expect(formatTime(9)).toBe('0:09');
		expect(formatTime(0)).toBe('0:00');
	});

	it('requires a guess before the deadline and records a confirmed round exactly once', () => {
		let game = playing();
		expect(finishRound(game, startedAt + 1)).toBe(game);
		game = placeGuess(game, targetLonLat, startedAt + 1);
		game = finishRound(game, startedAt + 2);
		expect(game.status).toBe('revealed');
		expect(game.results).toHaveLength(1);
		expect(game.results[0].distance).toBeLessThan(0.01);
		expect(game.results[0]).toMatchObject({ points: 5000, timedOut: false });
		expect(finishRound(game, game.deadline!)).toBe(game);
		expect(placeGuess(game, [0, 0], startedAt + 3)).toBe(game);
	});

	it('scores the current tentative guess automatically at the deadline', () => {
		const chosen = placeGuess(playing(), targetLonLat, startedAt + 1);
		const result = finishRound(chosen, chosen.deadline!);
		expect(result.results[0]).toMatchObject({ points: 5000, timedOut: true });
		expect(result.guess).toEqual(targetLonLat);
	});

	it('awards zero without a guess, including after a delayed background-tab tick', () => {
		const game = playing();
		const expired = finishRound(game, game.deadline! + 60_000);
		expect(expired.results[0]).toEqual({ distance: undefined, points: 0, timedOut: true });
		expect(expired.status).toBe('revealed');
	});

	it('rejects guesses arriving at or after the deadline, preserving any earlier guess', () => {
		const game = playing();
		const expired = placeGuess(game, targetLonLat, game.deadline!);
		expect(expired.guess).toBeUndefined();
		expect(expired.results[0].points).toBe(0);
		const chosen = placeGuess(game, [4.8357, 45.764], startedAt + 1);
		const lateGuess = placeGuess(chosen, targetLonLat, game.deadline! + 1);
		expect(lateGuess.guess).toEqual(chosen.guess);
		expect(lateGuess.results[0].points).toBeLessThan(5000);
	});

	it('clears guesses between rounds, preserves scores through retries, and ends after five', () => {
		let game = createGame();
		for (let round = 0; round < 5; round++) {
			// Loading/retrying a location keeps completed results and has no deadline.
			game = { status: 'loading', results: game.results };
			game = startRound(game, target, startedAt + round * 1_000_000);
			expect(game.guess).toBeUndefined();
			expect(remainingSeconds(game, startedAt + round * 1_000_000)).toBe(300);
			game = placeGuess(game, targetLonLat, game.deadline! - 1);
			game = finishRound(game, game.deadline! - 1);
			expect(game.status).toBe(round === 4 ? 'finished' : 'revealed');
			expect(totalPoints(game)).toBe((round + 1) * 5000);
		}
		expect(game.results).toHaveLength(5);
		expect(totalPoints(game)).toBe(MAX_GAME_POINTS);
		expect(startRound(game, target, 0)).toBe(game);
		const extraRound = { ...game, status: 'loading' as const };
		expect(startRound(extraRound, target, 0)).toBe(extraRound);
		expect(createGame()).toEqual({ status: 'loading', results: [] });
	});
});

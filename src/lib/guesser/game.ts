import type { Coordinate } from 'ol/coordinate.js';
import { guessDistance } from './round.js';

export const ROUND_COUNT = 5;
export const ROUND_DURATION_MS = 5 * 60 * 1000;
export const MAX_ROUND_POINTS = 5000;
export const PERFECT_DISTANCE_METRES = 50;
export const MAX_GAME_POINTS = ROUND_COUNT * MAX_ROUND_POINTS;

export interface RoundResult {
	distance?: number;
	points: number;
	timedOut: boolean;
}

export interface GameState {
	status: 'loading' | 'playing' | 'revealed' | 'finished' | 'error';
	results: RoundResult[];
	target?: Coordinate;
	guess?: Coordinate;
	deadline?: number;
	error?: string;
}

export function createGame(): GameState {
	return { status: 'loading', results: [] };
}

export function scoreDistance(metres: number): number {
	if (!Number.isFinite(metres) || metres < 0) return 0;
	if (metres <= PERFECT_DISTANCE_METRES) return MAX_ROUND_POINTS;
	// A France-scale exponential curve: about 1,840 points at 100 km.
	return Math.min(
		MAX_ROUND_POINTS - 1,
		Math.round(MAX_ROUND_POINTS * Math.exp(-(metres - PERFECT_DISTANCE_METRES) / 100_000))
	);
}

export function startRound(game: GameState, target: Coordinate, now: number): GameState {
	if (game.status !== 'loading' || game.results.length >= ROUND_COUNT) return game;
	return {
		status: 'playing',
		results: game.results,
		target,
		deadline: now + ROUND_DURATION_MS
	};
}

export function remainingSeconds(game: GameState, now: number): number {
	if (game.status !== 'playing' || game.deadline === undefined) return 0;
	return Math.max(0, Math.ceil((game.deadline - now) / 1000));
}

export function finishRound(game: GameState, now: number): GameState {
	if (game.status !== 'playing' || !game.target || game.deadline === undefined) return game;
	const timedOut = now >= game.deadline;
	if (!game.guess && !timedOut) return game;
	const distance = game.guess ? guessDistance(game.target, game.guess) : undefined;
	const results = [
		...game.results,
		{ distance, points: distance === undefined ? 0 : scoreDistance(distance), timedOut }
	];
	return {
		...game,
		status: results.length === ROUND_COUNT ? 'finished' : 'revealed',
		results
	};
}

export function placeGuess(game: GameState, guess: Coordinate, now: number): GameState {
	if (game.status !== 'playing' || game.deadline === undefined) return game;
	// Check the deadline here too: background tabs can delay the interval callback.
	if (now >= game.deadline) return finishRound(game, now);
	return { ...game, guess };
}

export function totalPoints(game: GameState): number {
	return game.results.reduce((total, result) => total + result.points, 0);
}

export function formatTime(seconds: number): string {
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

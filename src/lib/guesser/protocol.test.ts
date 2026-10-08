import { describe, expect, it, vi, afterEach } from 'vitest';
import {
	canonicalEmail,
	canonicalPseudonym,
	elapsed,
	withinDeadline,
	unexpired,
	formatMilliseconds
} from './protocol.js';
import { readDraft, writeDraft } from './client.js';
afterEach(() => vi.unstubAllGlobals());
describe('canonicalization and time boundaries', () => {
	it('normalizes Unicode names and email without provider-specific rewrites', () => {
		expect(canonicalPseudonym('  Ａnt Équipe  ')).toEqual({
			display: 'Ant Équipe',
			key: 'ant équipe'
		});
		expect(canonicalEmail('  Test.Name+jeu@EXAMPLE.COM ')).toBe('test.name+jeu@example.com');
		for (const value of ['ab', 'name\n', 'a'.repeat(25), 'bad<script>', 'zero\u200bwidth'])
			expect(() => canonicalPseudonym(value)).toThrow();
		for (const value of ['x', 'a@b', 'a b@c.fr', 'x@z.fr\r\nBcc: x'])
			expect(() => canonicalEmail(value)).toThrow();
	});
	it('uses an inclusive grace boundary and exclusive credential expiry', () => {
		expect(withinDeadline(300000, 305000)).toBe(true);
		expect(withinDeadline(300000, 305001)).toBe(false);
		expect(elapsed(1000, 999)).toBe(0);
		expect(elapsed(1000, 2345)).toBe(1345);
		expect(elapsed(1000, 306000)).toBe(300000);
		expect(unexpired(1000, 999)).toBe(true);
		expect(unexpired(1000, 1000)).toBe(false);
		expect(formatMilliseconds(123456)).toBe('2:03.456');
	});
	it('tolerates denied storage and corrupted drafts', () => {
		vi.stubGlobal('localStorage', {
			getItem() {
				throw new Error('blocked');
			},
			setItem() {
				throw new Error('blocked');
			},
			removeItem() {
				throw new Error('blocked');
			}
		});
		expect(readDraft()).toBeNull();
		expect(() => writeDraft({ version: 1, gameId: 'x', userId: null })).not.toThrow();
		vi.stubGlobal('localStorage', { getItem: () => '{bad' });
		expect(readDraft()).toBeNull();
	});
});

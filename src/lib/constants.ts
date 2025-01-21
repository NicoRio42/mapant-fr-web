import { dev } from '$app/environment';
import type { Contribution } from './server/schema';
import { PUBLIC_CF_PAGES_BRANCH } from '$env/static/public';

export const WEBSITE_NAME = 'Mapant.fr';
export const TILES_BASE_URL = 'https://mapant-tiles.ovh/tiles';
export const FRANCE_CENTER = [2.43028, 46.53972];
export const STAGING_BRANCH_NAME = 'staging';
export const TILE_SIZE_IN_METERS = 1000;
export const MAX_JOB_TIME_IN_SECONDS = 10 * 60;

const A4_WIDTH = 21 * 100; // metter
const A4_HEIGHT = 29.7 * 100; // metter

const A3_WIDTH = A4_HEIGHT; // metter
const A3_HEIGHT = A4_WIDTH * 2; // metter

const A2_WIDTH = A3_HEIGHT; // metter
const A2_HEIGHT = A3_WIDTH * 2; // metter

const A1_WIDTH = A2_HEIGHT; // metter
const A1_HEIGHT = A2_WIDTH * 2; // metter

const A0_WIDTH = A1_HEIGHT; // metter
const A0_HEIGHT = A1_WIDTH * 2; // metter

const DOUBLE_A0_WIDTH = A0_HEIGHT; // metter
const DOUBLE_A0_HEIGHT = A0_WIDTH * 2; // metter

export type ContributionFormula = {
	id: Contribution['formula'];
	label: string;
	priceInEuros: number;
	width: number;
	height: number;
	paiementLink: string;
};

export const CONTRIBUTION_FORMULAS: ContributionFormula[] = [
	{
		id: '1',
		label: 'A4',
		priceInEuros: 10,
		width: A4_WIDTH,
		height: A4_HEIGHT,
		paiementLink: dev
			? 'https://buy.stripe.com/test_9AQ8wV91wco89RS14a'
			: PUBLIC_CF_PAGES_BRANCH === STAGING_BRANCH_NAME
				? 'https://buy.stripe.com/test_cN27sR2D81Jue883cj'
				: 'https://buy.stripe.com/fZe2bp0tIbmH7bqeUZ'
	},
	{
		id: '2',
		label: 'A3',
		priceInEuros: 20,
		width: A3_WIDTH,
		height: A3_HEIGHT,
		paiementLink: dev
			? 'https://buy.stripe.com/test_aEU4gFb9E1Ju5BC5km'
			: PUBLIC_CF_PAGES_BRANCH === STAGING_BRANCH_NAME
				? 'https://buy.stripe.com/test_fZeeVj4Lg87Se886ow'
				: 'https://buy.stripe.com/8wM3ft90e9ezcvKbIJ'
	},
	{
		id: '3',
		label: 'A1',
		priceInEuros: 50,
		width: A1_WIDTH,
		height: A1_HEIGHT,
		paiementLink: dev
			? 'https://buy.stripe.com/test_aEU8wV91w4VGggg003'
			: PUBLIC_CF_PAGES_BRANCH === STAGING_BRANCH_NAME
				? 'https://buy.stripe.com/test_9AQ4gFgtY2Nyd448wF'
				: 'https://buy.stripe.com/cN2cQ33FUeyT1R6006'
	},
	{
		id: '4',
		label: 'Double A0',
		priceInEuros: 100,
		width: DOUBLE_A0_WIDTH,
		height: DOUBLE_A0_HEIGHT,
		paiementLink: dev
			? 'https://buy.stripe.com/test_6oE9AZ0v01Jue88148'
			: PUBLIC_CF_PAGES_BRANCH === STAGING_BRANCH_NAME
				? 'https://buy.stripe.com/test_6oE00pelQ1Ju9RS5ku'
				: 'https://buy.stripe.com/fZe3ft4JYcqLcvKbIP'
	},
	{
		id: '5',
		label: 'Méga tuile',
		priceInEuros: 500,
		width: 50000,
		height: 50000,
		paiementLink: dev
			? 'https://buy.stripe.com/test_00g5kJcdIdsc3tu4gl'
			: PUBLIC_CF_PAGES_BRANCH === STAGING_BRANCH_NAME
				? 'https://buy.stripe.com/test_eVa4gF5Pk87Sc00aEP'
				: 'https://buy.stripe.com/dR68zN2BQaiDeDS8wE'
	}
];

const MAPANT_V1_EXTENT_MIN_X = 907636.8207740805;
const MAPANT_V1_EXTENT_MAX_X = 972720.8671417263;
const MAPANT_V1_EXTENT_MIN_Y = 6542186.808607884;
const MAPANT_V1_EXTENT_MAX_Y = 6596005.251042297;

export let MAPANT_V1_EXTENT = [
	MAPANT_V1_EXTENT_MIN_X,
	MAPANT_V1_EXTENT_MIN_Y,
	MAPANT_V1_EXTENT_MAX_X,
	MAPANT_V1_EXTENT_MAX_Y
];

export let MAPANT_V1_CENTER = [
	(MAPANT_V1_EXTENT_MIN_X + MAPANT_V1_EXTENT_MAX_X) / 2,
	(MAPANT_V1_EXTENT_MIN_Y + MAPANT_V1_EXTENT_MAX_Y) / 2
];

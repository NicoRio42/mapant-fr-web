import { dev } from '$app/environment';

// export const TILES_BASE_URL = 'http://127.0.0.1:5000';
export const TILES_BASE_URL = 'https://mapant-tiles.ovh/tiles';
export const FRANCE_CENTER = [2.43028, 46.53972];

export const STRIPE_CHECKOUT_LINKS = dev
	? {
			'1': 'To be created',
			'2': 'https://buy.stripe.com/test_aEU4gFb9E1Ju5BC5km',
			'3': 'https://buy.stripe.com/test_aEU8wV91w4VGggg003',
			'4': 'https://buy.stripe.com/test_6oE9AZ0v01Jue88148',
			'5': 'https://buy.stripe.com/test_00g5kJcdIdsc3tu4gl'
		}
	: {
			'1': 'To be created',
			'2': 'https://buy.stripe.com/8wM3ft90e9ezcvKbIJ',
			'3': 'https://buy.stripe.com/8wM7vJa4iduP8fuaEG',
			'4': 'https://buy.stripe.com/8wMeYb1xM1M7dzO6or',
			'5': 'https://buy.stripe.com/8wM3ftgsGbmH2VaaEI'
		};

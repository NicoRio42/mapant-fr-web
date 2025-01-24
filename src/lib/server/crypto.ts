import { CRYPTO_SECRET_KEY } from '$env/static/private';

function stringToArrayBuffer(str: string): Uint8Array {
	return new TextEncoder().encode(str);
}

function bufferToHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.byteLength !== b.byteLength) {
		return false;
	}

	let result = 0;

	for (let i = 0; i < a.length; i++) {
		result |= a[i] ^ b[i];
	}

	return result === 0;
}

export async function generateApiKey(): Promise<string> {
	const keyBuffer = crypto.getRandomValues(new Uint8Array(32));
	return bufferToHex(keyBuffer.buffer);
}

export async function hashApiKey(apiKey: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		stringToArrayBuffer(CRYPTO_SECRET_KEY),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signature = await crypto.subtle.sign('HMAC', key, stringToArrayBuffer(apiKey));
	return bufferToHex(signature);
}

export async function verifyApiKey(providedKey: string, storedHash: string): Promise<boolean> {
	const hashedKey = await hashApiKey(providedKey);

	const hashedKeyBuffer = stringToArrayBuffer(hashedKey);
	const storedHashBuffer = stringToArrayBuffer(storedHash);

	return timingSafeEqual(hashedKeyBuffer, storedHashBuffer);
}

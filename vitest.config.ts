import { defineConfig } from 'vitest/config';

// These are pure modules and isolated D1 integration tests. Starting the
// SvelteKit/Cloudflare dev proxy here leaves a second emulator alive at exit.
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } });

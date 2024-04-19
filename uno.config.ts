import { defineConfig, presetIcons, presetWind, presetAttributify } from 'unocss';
import extractorSvelte from '@unocss/extractor-svelte';

export default defineConfig({
	presets: [presetAttributify({ ignoreAttributes: ['font-size'] }), presetIcons(), presetWind()],
	extractors: [extractorSvelte()]
});

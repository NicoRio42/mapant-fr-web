import { defineConfig, presetIcons, presetWind, presetAttributify } from 'unocss';
import extractorSvelte from '@unocss/extractor-svelte';

export default defineConfig({
	presets: [presetAttributify({ ignoreAttributes: ['font-size'] }), presetIcons(), presetWind()],
	extractors: [extractorSvelte()],
	theme: {
		colors: {
			primary: 'var(--pico-primary)',
			whiteWithPrimary: 'hwb(159.34deg 90% 0%)',
			whiteWithPrimaryLight: 'hwb(159.34deg 95% 0%)',
			primaryUnderline: 'var(--pico-primary-underline)',
			tableBorderColor: 'var(--pico-table-border-color)',
			backgroundColor: 'var(--pico-background-color)'
		}
	}
});

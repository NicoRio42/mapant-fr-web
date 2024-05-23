import extractorSvelte from '@unocss/extractor-svelte';
import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss';

export default defineConfig({
	presets: [presetAttributify({ ignoreAttributes: ['font-size'] }), presetIcons(), presetUno()],
	extractors: [extractorSvelte()],
	theme: {
		colors: {
			primary: 'var(--pico-primary)',
			whiteWithPrimary: 'hwb(159.34deg 90% 0%)',
			whiteWithPrimaryLight: 'hwb(159.34deg 95% 0%)',
			primaryUnderline: 'var(--pico-primary-underline)',
			primaryBackground: 'var(--pico-primary-background)',
			tableBorderColor: 'var(--pico-table-border-color)',
			backgroundColor: 'var(--pico-background-color)',
			delColor: 'var(--pico-del-color)'
		},
		spacing: {
			spacing: 'var(--pico-spacing)'
		}
	}
});

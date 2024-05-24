import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import UnoCSS from 'unocss/vite';
import { marked } from 'marked';

function markdown(): Plugin {
	return {
		name: 'vite-markdown',
		transform(src, id) {
			if (!id.endsWith('.md')) return;

			return {
				code: `const htmlContent = \`${marked(src)}\`;export default htmlContent;`,
				map: null
			};
		}
	};
}

export default defineConfig({
	plugins: [UnoCSS(), sveltekit(), markdown()],
	build: { sourcemap: true }
});

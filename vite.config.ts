import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import UnoCSS from 'unocss/vite';
import MarkdownIt from 'markdown-it';
import markdownItAttrs from 'markdown-it-attrs';

function markdown(): Plugin {
	const md = new MarkdownIt({ html: true }).use(markdownItAttrs);

	return {
		name: 'vite-markdown',
		transform(src, id) {
			if (!id.endsWith('.md')) return;

			return {
				code: `const htmlContent = \`${md.render(src)}\`;export default htmlContent;`,
				map: null
			};
		}
	};
}

export default defineConfig({
	plugins: [UnoCSS(), sveltekit(), markdown()],
	build: { sourcemap: true }
});

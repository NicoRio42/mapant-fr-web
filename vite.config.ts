import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import UnoCSS from 'unocss/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { parse } from 'ultramatter';
import { marked } from 'marked';
import admonition from 'marked-admonition-extension';

function cleanUrl(href: string) {
	try {
		href = encodeURI(href).replace(/%25/g, '%');
	} catch {
		return null;
	}
	return href;
}

function markdown(): Plugin {
	marked.use({
		renderer: {
			image({ href, title, text }) {
				const cleanHref = cleanUrl(href);
				if (cleanHref === null) {
					return text;
				}
				href = cleanHref;

				let out = `<img src="${href}" alt="${text}"`;
				if (title) {
					out += ` title="${title}"`;
				}
				out += '>';
				return out;
			}
		}
	});

	marked.use(admonition);

	return {
		name: 'vite-markdown',
		transform(src, id) {
			if (!id.endsWith('.md')) return;

			const output = parse(src);
			const frontmatter = output.frontmatter ? JSON.stringify(output.frontmatter) : '{}';
			const content = marked.parse(output.content);

			return {
				code: `const htmlContent = \`${content}\`;export const frontmatter = ${frontmatter}; export default htmlContent;`,
				map: null
			};
		}
	};
}

export default defineConfig({
	plugins: [markdown(), UnoCSS(), enhancedImages(), sveltekit()],
	build: { sourcemap: true }
});

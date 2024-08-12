declare namespace svelteHTML {
	import type { AttributifyAttributes } from 'unocss';

	type HTMLAttributes = AttributifyAttributes;
}

declare module '*.md' {
	export default string;
	export const frontmatter: Record<string, any>;
}

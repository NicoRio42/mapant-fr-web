<script lang="ts">
	import { clickOutside } from '#lib/actions/click-outside.js';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		children?: Snippet;
		maxWidth?: string;
		label?: string;
	}

	let { open = $bindable(), children, maxWidth, label }: Props = $props();

	let dialog: HTMLElement | undefined = $state();

	$effect(() => {
		if (dialog === undefined) return;

		if (open) {
			if (dialog instanceof HTMLDialogElement) dialog.showModal();
			else dialog.setAttribute('open', '');
		} else {
			if (dialog instanceof HTMLDialogElement) dialog.close();
			else dialog.removeAttribute('open');
		}
	});

	const closeCallback = () => (open = false);
</script>

<dialog bind:this={dialog} onclose={closeCallback} aria-label={label}>
	<article use:clickOutside={closeCallback} style:max-width={maxWidth}>
		{@render children?.()}
	</article>
</dialog>

<style>
	article {
		max-height: calc(100vh - var(--pico-spacing) * 2);
		max-height: calc(100svh - var(--pico-spacing) * 2);
	}
</style>

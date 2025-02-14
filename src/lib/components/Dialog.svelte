<script lang="ts">
	import { clickOutside } from '$lib/actions/click-outside';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		children?: Snippet;
	}

	let { open = $bindable(), children }: Props = $props();

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

<dialog bind:this={dialog} onclose={closeCallback}>
	<article use:clickOutside={closeCallback}>
		{@render children?.()}
	</article>
</dialog>

<style>
	article {
		max-height: calc(100vh - var(--pico-spacing) * 2);
		max-height: calc(100svh - var(--pico-spacing) * 2);
	}
</style>

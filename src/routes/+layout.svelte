<script lang="ts">
	import { run } from 'svelte/legacy';

	import { afterNavigate, onNavigate } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { clickOutside } from '$lib/actions/click-outside';
	import type { OnNavigate } from '@sveltejs/kit';
	import { fade } from 'svelte/transition';
	import SubMenus from './SubMenus.svelte';

	import '@picocss/pico/css/pico.orange.css';
	// Do not remove this comment, it prevent prettier to reorder imports
	import './global-styles.css';
	// Do not remove this comment, it prevent prettier to reorder imports
	import './admonition.css';
	// Do not remove this comment, it prevent prettier to reorder imports
	import './global-view-transitions.css';
	// Do not remove this comment, it prevent prettier to reorder imports
	import 'uno.css';

	let { data, children } = $props();

	let showMenu = $state(false);
	let tooFast = $state(false);

	run(() => {
		if ($navigating !== null) {
			tooFast = true;
			setTimeout(() => (tooFast = false), 250);
		}
	});

	function isBackNavigation({ from, to }: OnNavigate): boolean {
		if (from === null || to === null) return false;

		return from.url.pathname !== to.url.pathname && from.url.pathname.startsWith(to.url.pathname);
	}

	function isSamePageNavigation({ from, to }: OnNavigate): boolean {
		if (from === null || to === null) return false;

		return from.url.pathname === to.url.pathname;
	}

	onNavigate((navigation) => {
		//@ts-ignore
		if (!document.startViewTransition) return;

		if (isBackNavigation(navigation)) {
			document.documentElement.classList.add('back-transition');
		}

		if (isSamePageNavigation(navigation)) {
			document.documentElement.classList.add('same-page-navigation');
		}

		return new Promise(async (resolve) => {
			//@ts-ignore
			const transition = document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});

			try {
				await transition.finished;
			} catch (e) {
				console.error(e);
			} finally {
				document.documentElement.classList.remove('back-transition', 'same-page-navigation');
			}
		});
	});

	afterNavigate(() => (showMenu = false));
</script>

{#if $navigating !== null && !tooFast}
	<progress fixed h-1 border rounded-none z-2></progress>
{/if}

<div flex="~ col" h-full>
	<nav shadow-xl class="container-fluid [view-transition-name:top-nav]" pl-0 z-1>
		<ul>
			<li py-2>
				<a
					href="/"
					flex
					items-center
					gap-2
					py-0
					decoration="none hover:none"
					text="hover:primary focus:primary"
				>
					<div bg-primary-background w-11 h-11 flex items-center justify-center>
						<i i-twemoji-ant block w6 h6 class="-scale-x-100"></i>
					</div>

					Mapant.fr
				</a>
			</li>
		</ul>

		<ul>
			<div class="hidden sm:contents">
				<SubMenus isUserConnected={data.isUserConnected} />
			</div>

			<li py-0 pr-0>
				<a
					href={data.isUserConnected ? '/contributions' : '/contribute/step-1'}
					role="button"
					class="!flex !py-1"
					items-center
					gap-2
					m-0
				>
					<i i-carbon-crop-growth block w5 h5></i>

					Contribuer
				</a>
			</li>

			<li py-0 pr-0 class="block sm:hidden">
				<button
					type="button"
					border-none
					class="outline focus:shadow-none"
					onclick={() => {
						// To make clickOutside work
						if (showMenu === false) setTimeout(() => (showMenu = true));
					}}
				>
					<i i-carbon-overflow-menu-vertical block w-5 h-5></i>
				</button>
			</li>
		</ul>
	</nav>

	{#if showMenu}
		<ul
			absolute
			top-13
			right-2
			z-1
			bg-background-color
			p-3
			rounded
			shadow
			flex="~ col"
			gap-2
			transition:fade={{ duration: 125 }}
			use:clickOutside={() => {
				// To make clickOutside work
				if (showMenu) showMenu = false;
			}}
		>
			<SubMenus isUserConnected={data.isUserConnected} />
		</ul>
	{/if}

	{@render children?.()}
</div>

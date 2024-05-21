<script>
	import SubMenus from './SubMenus.svelte';

	import '@picocss/pico/css/pico.orange.css';
	// Do not remove this comment, it is there to prevent the formatter to change the order of the style sheets
	import './global-styles.css';
	// Do not remove this comment, it is there to prevent the formatter to change the order of the style sheets
	import { enhance } from '$app/forms';
	import { navigating } from '$app/stores';
	import 'uno.css';
	import { clickOutside } from '$lib/actions/click-outside';
	import { fade } from 'svelte/transition';
	import { afterNavigate } from '$app/navigation';

	export let data;

	let showMenu = false;
	let tooFast = false;

	$: {
		if ($navigating !== null) {
			tooFast = true;
			setTimeout(() => (tooFast = false), 250);
		}
	}

	afterNavigate(() => (showMenu = false));
</script>

{#if $navigating !== null && !tooFast}
	<progress fixed h-1 border rounded-none z-2 />
{/if}

<div flex="~ col" h-full>
	<nav shadow-xl class="container-fluid" pl-0>
		<ul>
			<li py-2>
				<a href="/" flex items-center gap-2 py-0>
					<div bg-primary w-11 h-11 flex items-center justify-center>
						<i i-twemoji-ant block w6 h6 text-background-color class="-scale-x-100"></i>
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
					on:click={() => {
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

	<slot></slot>
</div>

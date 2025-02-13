<script lang="ts">
	import BaseMap from '$lib/components/map/BaseMap.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import welcomePopupContent from './welcome-popup.md';
	import { MetaTags } from 'svelte-meta-tags';
	import { WEBSITE_NAME } from '$lib/constants';
	import { page } from '$app/stores';
	import DrawBox from '$lib/components/map/DrawBox.svelte';
	import { clientExport } from '$lib/components/map/client-export';

	let isWelcomeDialogOpen = $state(false);
	let isDrawingExport = $state(false);
	let isExportWarningPopupOpen = $state(false);
	let isExportAreaTooBigPopupOpen = $state(false);
	let isExportLoading = $state(false);
</script>

<MetaTags
	title={WEBSITE_NAME}
	description="Une carte de course d'orientation de la France entière (en cours de création)"
	canonical={new URL($page.url.pathname, $page.url.origin).href}
	openGraph={{
		url: new URL($page.url.pathname, $page.url.origin).href,
		locale: 'fr_FR',
		images: [
			{ url: '/facebook.png', width: 1200, height: 630, alt: 'A LiDAR generated orienteering map' },
			{ url: '/whatsapp.png', width: 400, height: 400, alt: 'A LiDAR generated orienteering map' }
		]
	}}
	twitter={{ cardType: 'summary_large_image' }}
/>

{#if isWelcomeDialogOpen}
	<dialog open transition:fade={{ duration: 125 }}>
		<article>
			<div flex>
				<h1 grow>Road to Mapant.fr V2 !</h1>

				<button
					type="button"
					m-0
					p-1
					border-none
					h-fit
					class="outline"
					onclick={() => (isWelcomeDialogOpen = false)}
				>
					<i i-carbon-close-large w-5 h-5 block></i>
				</button>
			</div>

			{@html welcomePopupContent}

			<p text="right 5 gray-6"><em>Nicolas Rio</em></p>

			<p flex justify-end gap-4>
				<button type="button" m-0 class="outline" onclick={() => (isWelcomeDialogOpen = false)}>
					Fermer
				</button>

				<a href="/contribute/step-1" role="button" flex="!~" items-center gap-2 w-fit>
					Contribuer

					<i i-carbon-arrow-right block h-5 w-5></i>
				</a>
			</p>
		</article>
	</dialog>
{/if}

{#if isExportWarningPopupOpen}
	<dialog open transition:fade={{ duration: 125 }}>
		<article>
			<p font-bold mt-4>Vous êtes sur le point d'exporter une zone de la carte Mapant.fr</p>

			<p>
				Attention, la possession de cette carte n'implique pas un droit d'accès permanent au
				terrain. Avant de visiter la zone cartographiée, assurez vous d'avoir les droits d'accès
				nécessaires.
			</p>

			<p>
				Mapant.fr et Nicolas Rio déclinent toute responsabilité en cas d'accès non autorisé à une
				zone cartographiée par la carte exportée.
			</p>

			<p>
				L'export généré est une image au format png. La carte doit être imprimée à la résolution
				600dpi pour être à l'échelle 1:10000.
			</p>

			<p flex justify-end gap-4>
				<button
					type="button"
					m-0
					class="outline"
					onclick={() => (isExportWarningPopupOpen = false)}
				>
					Annuler
				</button>

				<button
					type="button"
					m-0
					flex="!~"
					items-center
					gap-2
					w-fit
					onclick={() => {
						isExportWarningPopupOpen = false;
						isDrawingExport = true;
					}}
				>
					Exporter

					<i i-carbon-arrow-right block h-5 w-5></i>
				</button>
			</p>
		</article>
	</dialog>
{/if}

{#if isExportAreaTooBigPopupOpen}
	<dialog open transition:fade={{ duration: 125 }}>
		<article>
			<p font-bold mt-4>La zone est trop grande pour être exportée.</p>

			<p flex justify-end gap-4>
				<button
					type="button"
					m-0
					class="outline"
					onclick={() => (isExportAreaTooBigPopupOpen = false)}
				>
					Fermer
				</button>
			</p>
		</article>
	</dialog>
{/if}

<BaseMap class={isDrawingExport ? 'cursor-crosshair' : undefined}>
	<button
		absolute
		top-12
		right-2
		flex
		items-center
		justify-center
		w-8
		h-8
		p-0
		bg-white
		class="outline"
		type="button"
		aria-label="Draw"
		onclick={() => {
			if (isDrawingExport) isDrawingExport = false;
			else isExportWarningPopupOpen = true;
		}}
	>
		{#if isExportLoading}
			<i aria-busy="true" w-5 h-5 block></i>
		{:else}
			<i i-carbon-download w-5 h-5 block></i>
		{/if}
	</button>

	<button
		onclick={() => (isWelcomeDialogOpen = true)}
		type="button"
		absolute
		bottom-6
		right-2
		m-0
		p="x-2 y-1"
		bg-white
		class="outline"
	>
		Message d'accueil
	</button>

	{#if isDrawingExport}
		<DrawBox
			ondrawend={async (e) => {
				const extent = e.feature.getGeometry()?.getExtent();

				if (!extent) {
					isDrawingExport = false;
					return;
				}

				const [x1, y1, x2, y2] = extent;
				isExportLoading = true;
				const error = await clientExport({ x1, y1, x2, y2 });
				isExportLoading = false;
				if (error !== null) isExportAreaTooBigPopupOpen = true;
				isDrawingExport = false;
			}}
		/>
	{/if}
</BaseMap>

<style>
	article {
		max-height: calc(100vh - var(--pico-spacing) * 2);
		max-height: calc(100svh - var(--pico-spacing) * 2);
	}
</style>

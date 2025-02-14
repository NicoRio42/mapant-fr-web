<script lang="ts">
	import { page } from '$app/stores';
	import Dialog from '$lib/components/Dialog.svelte';
	import BaseMap from '$lib/components/map/BaseMap.svelte';
	import DrawBox from '$lib/components/map/DrawBox.svelte';
	import { clientExport } from '$lib/components/map/client-export';
	import { WEBSITE_NAME } from '$lib/constants';
	import { MetaTags } from 'svelte-meta-tags';
	import welcomePopupContent from './welcome-popup.md';

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

<Dialog bind:open={isWelcomeDialogOpen}>
	<div flex mt-4>
		<h2 text-5 font-bold grow>Le Mapant nouveau est arrivé !</h2>

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
		<button type="button" class="outline" m-0 onclick={() => (isWelcomeDialogOpen = false)}>
			Retour à la carte
		</button>
	</p>
</Dialog>

<Dialog bind:open={isExportWarningPopupOpen}>
	<p font-bold mt-4>Vous êtes sur le point d'exporter une zone de la carte Mapant.fr</p>

	<p>
		Attention, la possession de cette carte n'implique pas un droit d'accès permanent au terrain.
		Avant de visiter la zone cartographiée, assurez vous d'avoir les droits d'accès nécessaires.
	</p>

	<p>
		Mapant.fr et Nicolas Rio déclinent toute responsabilité en cas d'accès non autorisé à une zone
		de la carte Mapant.fr.
	</p>

	<p>
		L'export généré est une image au format png. La carte doit être imprimée à la résolution 600dpi
		pour être à l'échelle 1:10000.
	</p>

	<p flex justify-end gap-4>
		<button type="button" m-0 class="outline" onclick={() => (isExportWarningPopupOpen = false)}>
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
</Dialog>

<Dialog bind:open={isExportAreaTooBigPopupOpen}>
	<p font-bold mt-4>La zone est trop grande pour être exportée.</p>

	<p flex justify-end gap-4>
		<button type="button" m-0 class="outline" onclick={() => (isExportAreaTooBigPopupOpen = false)}>
			Fermer
		</button>
	</p>
</Dialog>

<BaseMap persistMapState class={isDrawingExport ? 'cursor-crosshair' : undefined}>
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
		disabled={isExportLoading}
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

	<div absolute bottom-6 right-2>
		<button
			onclick={() => (isWelcomeDialogOpen = true)}
			type="button"
			relative
			m-0
			p="x-2 y-1"
			bg-white
			class="outline"
		>
			Infos

			<span
				absolute
				top="-3"
				left-0
				text="3 white"
				px-1
				rounded-full
				font-bold
				bg-primary-background>new</span
			>
		</button>
	</div>

	{#if isDrawingExport}
		<DrawBox
			ondrawend={async (e) => {
				isDrawingExport = false;
				const extent = e.feature.getGeometry()?.getExtent();
				if (!extent) return;
				const [x1, y1, x2, y2] = extent;
				isExportLoading = true;
				const error = await clientExport({ x1, y1, x2, y2 });
				isExportLoading = false;
				if (error !== null) isExportAreaTooBigPopupOpen = true;
			}}
		/>
	{/if}
</BaseMap>

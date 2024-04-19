<script>
	import OLMap from '$lib/components/map/OLMap.svelte';
	import Osm from '$lib/components/map/OSM.svelte';
	import PlanIgnLambert93 from '$lib/components/map/PlanIgnLambert93.svelte';
</script>

<main grow>
	<OLMap>
		<Osm />
		<PlanIgnLambert93 />
	</OLMap>
</main>

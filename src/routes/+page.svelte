<script>
	import LidarHdTiles from '$lib/components/map/LidarHdTiles.svelte';
	// import MapLibreLayer from '$lib/components/map/MapLibreLayer.svelte';
	import Mapant from '$lib/components/map/Mapant.svelte';
	import OLMap from '$lib/components/map/OLMap.svelte';
	import Osm from '$lib/components/map/OSM.svelte';
</script>

<main grow>
	<OLMap>
		<Osm />
		<!-- <MapLibreLayer /> -->
		<Mapant />
		<LidarHdTiles />
	</OLMap>
</main>

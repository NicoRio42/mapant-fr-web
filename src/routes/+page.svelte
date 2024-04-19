<script>
	import LidarHdTiles from '$lib/components/map/LidarHdTiles.svelte';
	import Mapant from '$lib/components/map/Mapant.svelte';
	import OLMap from '$lib/components/map/OLMap.svelte';
	import Osm from '$lib/components/map/OSM.svelte';
</script>

<main grow>
	<OLMap>
		<Osm />
		<Mapant />
		<LidarHdTiles />
	</OLMap>
</main>

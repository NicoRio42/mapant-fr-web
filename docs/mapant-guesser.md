# Mapant Guesser POC

Open `/guesser`, also linked in the site navigation. The game is browser-only: no account, score persistence, or server session. The answer and tile coordinates are inspectable in developer tools.

## Rounds

The picker samples uniformly in a Lambert-93 bounding rectangle and rejects points outside the metropolitan France boundary (including Corsica). It checks the native zoom-13 tile with HEAD, then its eight immediate neighbours. Only HTTP 200 counts as coverage; 204 and 404 trigger another candidate. Other statuses and network failures produce a retryable error. Searches stop after 30 candidates or 20 seconds; restarting or leaving the page cancels outstanding requests.

This is an approximate coverage check. A stored tile can still contain blank pixels, and the 3×3 neighbourhood does not guarantee the entire viewport or all areas reachable by panning are covered. A coverage mask generated with the archive would improve that later. The current tile server reads tile data from R2 even for HEAD requests.

The exploration map uses the existing EPSG:2154 grid: initial resolution 1.953125 m/pixel, allowed range 0.9765625–1.953125 m/pixel. While playing, zooming out stops at the initial zoom. Panning is unrestricted. The IGN layer and persisted main-map position are not used. Returning to the start restores the target, resolution, and north-up rotation.

The independent OSM map starts fitted to France. A click places or moves a tentative guess. The map instance stays mounted when closing the dialog, retaining the guess, center, zoom, and rotation when reopened. Confirmation freezes it, calculates great-circle distance in metres from WGS84 longitude/latitude using OpenLayers, and reveals both markers and a connecting line on both maps. Exploration zoom restrictions are lifted after confirmation. A new round clears all prior state.

## Boundary data

`src/lib/guesser/france-boundary.json` contains the three metropolitan polygons selected from the France feature of [Natural Earth 1:50m Admin 0 Countries](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson), downloaded 2026-10-02. Polygons were retained when every exterior-ring coordinate was within longitude −6…10 and latitude 41…52. Coordinates are otherwise unchanged; overseas territories are excluded. This generalised boundary is a sampling mask, not a cadastral or exact coastal boundary.

Natural Earth data is [public domain](https://www.naturalearthdata.com/about/terms-of-use/). OSM tiles use OpenLayers' standard OSM source, visible attribution, and browser caching; see the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

## Development and verification

Run `npm run dev` and open `/guesser`. As on the main map, development requests the local tile server at `http://[::]:8080/data/mapant`; it must support HEAD and CORS. Production uses `/api/tiles`.

Run `npm run check`, `npm test -- --run`, and `npm run build`. The guesser tests cover France sampling, tile coordinates, missing tiles, server errors, timeouts, cancellation, great-circle distances, and strict exploration resolution constraints.

Manual checks: on both maps, pan with the first mouse drag or one-finger swipe without clicking or focusing the map first, and repeat after focusing a button outside the map. On a small touch screen, also check pinch zoom and that a swipe moves the map without scrolling the page or placing a guess. Pan and zoom the OSM map, select/move a guess with a click or tap, close/reopen the dialog, and verify that the view and guess are preserved. Confirm once, inspect both maps, return to the start, and restart during loading. Verify that a new round starts the OSM map fitted to France with no guess. An unavailable local tile server should show a retryable error.

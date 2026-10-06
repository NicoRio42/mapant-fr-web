# Mapant Guesser

Open `/guesser`, also linked in the site navigation. The game is browser-only: no account, score persistence, or server session. The answer and tile coordinates are inspectable in developer tools.

## Games and scoring

Each game has five rounds, with five minutes per round. The countdown starts after the coverage search finds a location; loading and retries do not consume playing time. The remaining time appears on the main page and in the guess dialog. Closing the dialog or switching tabs does not pause it. At expiry the current tentative guess is automatically submitted; no guess scores zero points. Completed rounds cannot be scored twice or edited. Continue with “Manche suivante” after each result; after round five the dialog shows all five distances and scores, plus a total out of 25,000. “Nouvelle partie” or “Rejouer une partie” resets the game.

A great-circle distance of 50 m or less earns 5,000 points. Beyond 50 m, the score is `min(4999, round(5000 × exp(-(distanceMetres - 50) / 100000)))`. This France-scale curve gives roughly 4,526 points at 10 km, 1,840 at 100 km, and 34 at 500 km. It is a local scoring rule, rather than a reproduction of GeoGuessr's map-dependent formula. Points are integers and fall to zero for sufficiently distant guesses.

## Location selection and maps

The picker samples uniformly in a Lambert-93 bounding rectangle and rejects points outside the metropolitan France boundary (including Corsica). It checks the native zoom-13 tile with HEAD, then its eight immediate neighbours. Only HTTP 200 counts as coverage; 204 and 404 trigger another candidate. Other statuses and network failures produce a retryable error. Searches stop after 30 candidates or 20 seconds; restarting or leaving the page cancels outstanding requests.

This is an approximate coverage check. A stored tile can still contain blank pixels, and the 3×3 neighbourhood does not guarantee the entire viewport or all areas reachable by panning are covered. A coverage mask generated with the archive would improve that later. The current tile server reads tile data from R2 even for HEAD requests.

The exploration map uses the existing EPSG:2154 grid: initial resolution 1.953125 m/pixel, allowed range 0.9765625–1.953125 m/pixel. On mobile viewports (600px wide or less), the initial and maximum resolution are doubled to 3.90625 m/pixel (native zoom 11), showing twice the ground distance across the map. The zoom-out limit updates when the viewport crosses this breakpoint. While playing, zooming out stops at the initial zoom for the current viewport. Panning is unrestricted. The IGN layer and persisted main-map position are not used. Returning to the start restores the target, viewport-appropriate resolution, and north-up rotation.

The independent OSM map starts fitted to France. A click places or moves a tentative guess. The map instance stays mounted when closing the dialog, retaining the guess, center, zoom, and rotation when reopened. Confirmation or timeout freezes it, calculates great-circle distance in metres from WGS84 longitude/latitude using OpenLayers, and reveals both markers and a connecting line on both maps. A timeout without a guess reveals only the target. Exploration zoom restrictions are lifted after reveal. A new round clears the maps and guess while retaining the game's completed results. Location-search errors can be retried without losing those results.

When the start point is outside the viewport, an orange dot and arrow stay inset from the map edge and point toward it. The indicator follows panning, zooming, rotation, and resizing, and disappears as soon as the start point is visible again. It is an HTML button: clicking it or activating it with Enter or Space flies back to the start, using the same zoom and north-up rotation as “Retour au départ” on the exploration map. On the OSM guess map, it only appears after the answer is revealed, and returning keeps the current zoom. Focus moves to the map as the indicator disappears.

Click or tap the exploration map to open an OpenLayers Overlay popup at that location, then select “Ajouter un checkpoint”. Checkpoints are blue numbered buttons (1, 2, 3, …); when offscreen, they become numbered edge indicators pointing toward their saved positions. Clicking a checkpoint or activating it with Enter or Space flies back there with the same viewport-appropriate resolution and north-up rotation as returning to the start. Close the popup with its close button or Escape. Checkpoints remain through the round result and clear on the next round or a new game; they do not affect scoring or the result map's fitted extent. The OSM map still uses clicks to place guesses.

## Boundary data

`src/lib/guesser/france-boundary.json` contains the three metropolitan polygons selected from the France feature of [Natural Earth 1:50m Admin 0 Countries](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson), downloaded 2026-10-02. Polygons were retained when every exterior-ring coordinate was within longitude −6…10 and latitude 41…52. Coordinates are otherwise unchanged; overseas territories are excluded. This generalised boundary is a sampling mask, not a cadastral or exact coastal boundary.

Natural Earth data is [public domain](https://www.naturalearthdata.com/about/terms-of-use/). OSM tiles use OpenLayers' standard OSM source, visible attribution, and browser caching; see the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

## Development and verification

Run `npm run dev` and open `/guesser`. As on the main map, development requests the local tile server at `http://[::]:8080/data/mapant`; it must support HEAD and CORS. Production uses `/api/tiles`.

Run `npm run check`, `npm test -- --run`, and `npm run build`. The guesser tests cover France sampling, tile coordinates, missing tiles, server errors, timeouts, cancellation, great-circle distances, strict exploration resolution constraints, scoring boundaries, deadlines, late guesses, one-time scoring, and five-round totals.

Manual checks: on both maps, pan with the first mouse drag or one-finger swipe without clicking or focusing the map first, and repeat after focusing a button outside the map. On a small touch screen, also check pinch zoom and that a swipe moves the map without scrolling the page or placing a guess. Pan and zoom the OSM map, select/move a guess with a click or tap, close/reopen the dialog, and verify that the view and guess are preserved. Confirm once, inspect both maps, return to the start, and restart during loading. Verify that a new round starts the OSM map fitted to France with no guess. An unavailable local tile server should show a retryable error.

Checkpoint checks: click several exploration locations and confirm numbered blue markers are added only after pressing “Ajouter un checkpoint”. Open a popup near each map edge and verify its button stays visible. Close with Escape or the close button without adding a marker. Pan, zoom, rotate, and resize until checkpoints are offscreen, then return using their numbered edge buttons; repeat using Enter or Space. Click a visible checkpoint and verify the flight centers it without opening another popup. Confirm a guess and verify checkpoints persist without changing the result's fitted extent; advance to the next round and verify numbering starts again at 1.

Game checks: finish five rounds and verify the summary and total, then replay and check that the score resets. Let the timer expire with and without a placed guess, including while the dialog is closed or the tab is inactive. Verify that the result opens automatically and the answer is visible even without a guess. Check the countdown in the dialog and that it resets to 5:00 for each newly loaded location. Retry a coverage failure midway through a game and verify that earlier scores remain.

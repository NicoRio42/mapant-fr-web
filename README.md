# Mapant.fr web

The site is a SvelteKit app deployed to Cloudflare Workers. Its configuration is in [`wrangler.jsonc`](wrangler.jsonc). The `R2_BUCKET_MAPANT` binding reads the `mapant-fr` bucket and serves tiles from `2026-09-28-mapant-fr.pmtiles` through `/api/tiles/{z}/{x}/{y}.webp`.

The map and browser exports retain the existing Lambert-93 (EPSG:2154) tile grid, zooms 0–13, and 256-pixel tiles. The archive must use that grid and contain WebP tiles.

## Develop locally

Install dependencies with `bun install`, then run `npm run dev`. No environment variables are required. Both the map and exports request `http://[::]:8080/data/mapant/{z}/{x}/{y}.webp`. Start your local tile server on port 8080 and enable CORS so browser exports can read the tiles.

## PMTiles endpoint and caching

The endpoint adapts the [Protomaps Cloudflare Worker](https://github.com/protomaps/PMTiles/blob/main/serverless/cloudflare/src/index.ts): it reads R2 byte ranges, uses native gzip decompression, and keeps resolved archive headers/directories in an isolate-local cache. It serves GET and HEAD requests, returns 204 for absent tiles and 404 for zooms outside the archive, and rejects invalid coordinates before accessing R2.

[Workers Cache](https://developers.cloudflare.com/workers/cache/) is enabled with `cache.enabled` in Wrangler. Tile responses send `Cache-Control: public, max-age=86400`; Cloudflare caches responses before invoking the Worker, without `caches.default` calls. Storage failures are not cached. Responses without an explicit cache policy receive `no-store` in the server hook to prevent heuristic caching of other application routes.

The archive key is defined in `src/lib/server/mapant-pmtiles.ts`. For a future archive, upload under a new dated key, update that constant, and redeploy. Workers Cache uses the Worker version in its default cache key. Browsers can retain existing tiles for up to one day; the existing `?bypass-cache` page option adds a timestamp to tile URLs to request fresh tiles.

## Deploy to Cloudflare Workers

The `mapant-fr` R2 bucket and `2026-09-28-mapant-fr.pmtiles` object must exist in the same Cloudflare account. The old `mapant-fr-tiles` bucket binding is removed from the application configuration; this does not delete the remote bucket or its contents.

In Workers Builds, use `npm run build` as the build command and `npx wrangler deploy` as the deploy command. For a CLI deployment, run `npm run deploy`. No `PUBLIC_MAPANT_TILES_BASE_URL` variable is needed: production uses the same-origin `/api/tiles` endpoint. Attach the desired custom domain to the Worker in Cloudflare after creating it.

Verify a known populated tile after deployment with two GET requests and inspect `Cf-Cache-Status` for a cache hit. Local development cannot verify Cloudflare's distributed cache.

## Uploading PMTiles to R2

See [Upload a large PMTiles archive to Cloudflare R2](docs/r2-pmtiles-upload.md)

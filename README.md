# Mapant.fr web

The site is a SvelteKit app deployed to Cloudflare Workers. Its Worker configuration is in [`wrangler.jsonc`](wrangler.jsonc), including the `R2_BUCKET_TILES` binding for the `mapant-fr-tiles` bucket.

## Develop locally

Copy `.env.example` to `.env`, install dependencies, then run `npm run dev`. The local tile URL points to `/api/tiles`, which reads from Wrangler's local R2 binding.

## Deploy to Cloudflare Workers

Set the build-time `PUBLIC_MAPANT_TILES_BASE_URL` variable to the public tile URL used by the site. The `/api/tiles` route is for development only. In Workers Builds, use `npm run build` as the build command and `npx wrangler deploy` as the deploy command.

For a CLI deployment, set `PUBLIC_MAPANT_TILES_BASE_URL` in the build environment, then run `npm run deploy`. The `mapant-fr-tiles` R2 bucket must exist in the same Cloudflare account. Attach the desired custom domain to the Worker in Cloudflare after creating it.

## Uploading PMTiles to R2

See [Upload a large PMTiles archive to Cloudflare R2](docs/r2-pmtiles-upload.md).

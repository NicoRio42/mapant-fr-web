# Upload a large PMTiles archive to Cloudflare R2

Use `rclone` for a roughly 200 GB archive. R2 requires multipart upload for objects larger than 5 GiB, and Cloudflare recommends an S3-compatible tool such as rclone for large uploads. Wrangler's simple `r2 object put` command is better suited to small objects. The script uses 128 MiB parts and four concurrent part uploads by default: about 1,500–1,600 parts for a 200 GB archive, safely below R2's 10,000-part limit. It needs roughly 512 MiB of upload buffers, plus overhead. See the [R2 upload guide](https://developers.cloudflare.com/r2/objects/upload-objects/), [R2 limits](https://developers.cloudflare.com/r2/platform/limits/), and [rclone's R2 guide](https://developers.cloudflare.com/r2/examples/rclone/).

## Prerequisites

1. Install [rclone](https://rclone.org/downloads/) version 1.59 or newer.
2. Create the destination R2 bucket in Cloudflare. The project's current `wrangler.jsonc` includes `mapant-fr`, but you can use another bucket.
3. Create an [R2 API token](https://developers.cloudflare.com/r2/api/tokens/) with **Object Read & Write** access to that bucket. Copy its **Access Key ID** and **Secret Access Key**, and find the 32-character **Account ID** in the Cloudflare dashboard. The script assumes the bucket already exists and works with bucket-scoped object permissions. For an EU, US, or FedRAMP jurisdiction bucket, set `R2_JURISDICTION` as described below.
4. Keep the local archive unchanged until the upload finishes. Have a stable connection and enough time for a full upload.

## Set the environment variables

In the terminal that will run the upload:

```bash
export R2_ACCOUNT_ID='0123456789abcdef0123456789abcdef'
export R2_ACCESS_KEY_ID='your-r2-access-key-id'
export R2_BUCKET='mapant-fr'
read -rsp 'R2 secret access key: ' R2_SECRET_ACCESS_KEY; echo
export R2_SECRET_ACCESS_KEY
```

The `read` command keeps the secret out of shell history. Do not commit credentials or paste them into issue reports or logs. The script passes them to rclone through environment variables, without writing an rclone configuration file.

| Variable                | Purpose                                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `R2_ACCOUNT_ID`         | Cloudflare account ID; used to form the R2 S3 endpoint.                                                                                                     |
| `R2_JURISDICTION`       | Optional R2 bucket jurisdiction: `eu`, `us`, or `fedramp`. Omit for a default-jurisdiction bucket. The script uses the matching S3 endpoint.                |
| `R2_ACCESS_KEY_ID`      | Access Key ID from the R2 API token.                                                                                                                        |
| `R2_SECRET_ACCESS_KEY`  | Secret Access Key from the same token.                                                                                                                      |
| `R2_BUCKET`             | Existing destination bucket.                                                                                                                                |
| `R2_OBJECT_KEY`         | Optional path and filename inside the bucket; defaults to the local filename. For example, `2026-09-28-mapant-fr.pmtiles`.                                  |
| `R2_UPLOAD_CONCURRENCY` | Optional number of parts uploaded at once, from 1 to 32; defaults to 4. Each slot buffers about 128 MiB, so increase it only if memory and bandwidth allow. |

If using a local credentials file, save it as `.env.r2` (already covered by `.gitignore`), restrict it with `chmod 600 .env.r2`, and load it with `set -a; source .env.r2; set +a`. Quote values as shell strings in that file.

## Upload

From the repository root:

```bash
R2_OBJECT_KEY='2026-09-28-mapant-fr.pmtiles' \
  ./scripts/upload-pmtiles-r2.sh /absolute/path/to/2026-09-28-mapant-fr.pmtiles
```

The object will be stored at `mapant-fr/2026-09-28-mapant-fr.pmtiles` in this example. Omit `R2_OBJECT_KEY` to use the local filename at the bucket root. `rclone copyto` skips an already matching object; if the destination differs, it replaces it. Choose a new key if you want to retain the old archive.

The script shows progress and returns a nonzero exit status on failure. It retries failed requests or parts within the running process. If the process or machine stops, rerun the same command; **rclone does not resume a partly uploaded single file across process restarts**, so it may need to upload the whole archive again. R2 normally aborts incomplete multipart uploads after seven days. For long uploads, run the command in a persistent terminal such as `tmux`.

Rclone checks each multipart part and checks the completed object's ETag with a HEAD request. A completed multipart object's ETag is **not** the MD5 of the whole archive. If you need an additional end-to-end check, compare the local file's `md5sum` with `rclone md5sum` of the object using an rclone R2 remote; calculating the local hash requires reading the entire archive again. See [rclone's S3 integrity notes](https://rclone.org/s3/#data-integrity).

The application serves WebP tiles from `mapant-fr/2026-09-28-mapant-fr.pmtiles` through `/api/tiles/{z}/{x}/{y}.webp`, using R2 byte-range reads. See the [endpoint and caching documentation](../README.md#pmtiles-endpoint-and-caching).

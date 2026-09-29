#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... \
       R2_BUCKET=... [R2_JURISDICTION=eu|us|fedramp] \
       [R2_OBJECT_KEY=...] [R2_UPLOAD_CONCURRENCY=4] \
       scripts/upload-pmtiles-r2.sh /absolute/path/to/archive.pmtiles

Uploads one local PMTiles archive to an existing Cloudflare R2 bucket.
R2_OBJECT_KEY defaults to the archive's filename.
EOF
}

if [[ ${1:-} == --help || ${1:-} == -h ]]; then
  usage
  exit 0
fi

if [[ $# -ne 1 ]]; then
  usage >&2
  exit 2
fi

archive=$1
if [[ ! -f $archive || ! -r $archive ]]; then
  printf 'Archive must be a readable regular file: %s\n' "$archive" >&2
  exit 2
fi

for name in R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET; do
  if [[ -z ${!name:-} ]]; then
    printf 'Missing required environment variable: %s\n' "$name" >&2
    exit 2
  fi
done

if [[ ! $R2_ACCOUNT_ID =~ ^[[:xdigit:]]{32}$ ]]; then
  printf 'R2_ACCOUNT_ID must be a 32-character hexadecimal Cloudflare account ID.\n' >&2
  exit 2
fi
if [[ ! $R2_BUCKET =~ ^[a-z0-9][a-z0-9.-]*$ ]]; then
  printf 'R2_BUCKET must be an R2 bucket name, without a path.\n' >&2
  exit 2
fi

case ${R2_JURISDICTION:-default} in
  default) endpoint="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" ;;
  eu|us|fedramp) endpoint="https://${R2_ACCOUNT_ID}.${R2_JURISDICTION}.r2.cloudflarestorage.com" ;;
  *)
    printf 'R2_JURISDICTION must be default, eu, us, or fedramp.\n' >&2
    exit 2
    ;;
esac

object_key=${R2_OBJECT_KEY:-$(basename "$archive")}
if [[ -z $object_key || $object_key == /* || $object_key == */ || $object_key == *//* ]]; then
  printf 'R2_OBJECT_KEY must be a nonempty relative object key.\n' >&2
  exit 2
fi

concurrency=${R2_UPLOAD_CONCURRENCY:-4}
if [[ ! $concurrency =~ ^[1-9][0-9]*$ ]] || (( concurrency > 32 )); then
  printf 'R2_UPLOAD_CONCURRENCY must be an integer from 1 to 32.\n' >&2
  exit 2
fi

if ! command -v rclone >/dev/null 2>&1; then
  printf 'rclone is required (version 1.59 or newer).\n' >&2
  exit 2
fi

# Configure an isolated rclone remote using environment variables, so no
# credential is put in a config file or command-line argument.
export RCLONE_CONFIG_MAPANT_R2_UPLOAD_TYPE=s3
export RCLONE_CONFIG_MAPANT_R2_UPLOAD_PROVIDER=Cloudflare
export RCLONE_CONFIG_MAPANT_R2_UPLOAD_REGION=auto
export RCLONE_CONFIG_MAPANT_R2_UPLOAD_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export RCLONE_CONFIG_MAPANT_R2_UPLOAD_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_MAPANT_R2_UPLOAD_ENDPOINT="$endpoint"
export RCLONE_CONFIG_MAPANT_R2_UPLOAD_NO_CHECK_BUCKET=true

destination="mapant_r2_upload:${R2_BUCKET}/${object_key}"
printf 'Uploading %s to %s (128 MiB parts, %s concurrent parts)\n' "$archive" "$destination" "$concurrency"

exec rclone copyto "$archive" "$destination" \
  --s3-upload-cutoff 128Mi \
  --s3-chunk-size 128Mi \
  --s3-upload-concurrency "$concurrency" \
  --low-level-retries 10 \
  --retries 1 \
  --progress \
  --stats 30s

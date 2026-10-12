#!/bin/sh
set -eu
if [ "${VERCEL_TARGET_ENV:-}" = "sanity-preview" ]; then
  NUXT_SANITY_PREVIEW=true yarn build
else
  NUXT_BUILD_MODE=static NUXT_SANITY_PREVIEW=false yarn generate
fi

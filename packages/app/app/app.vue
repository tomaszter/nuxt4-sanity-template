<template>
  <VercelAnalytics />
  <NuxtPwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script lang="ts" setup>
if (process.env.NODE_ENV === 'development') {
  useHead({
    // @ts-expect-error unhead doesn't provide typings for custom attributes
    bodyAttrs: { 'dev-mode': '' },
  });
}
</script>

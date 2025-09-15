<template>
  <div>
    <h1>Error page</h1>
    <div>Also used as 404 page for Vercel</div>
    <div>
      <!-- Error coming from Nuxt or 404 Page not found -->
      {{ error ?? 404 }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { NuxtError } from '#app';

const { error } = defineProps<{ error?: NuxtError }>();
</script>

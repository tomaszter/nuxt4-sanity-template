<script setup lang="ts">
import type { NuxtError } from '#app';
defineProps<{ error?: NuxtError }>();
</script>
<template>
  <main class="mx-auto max-w-3xl px-6 py-20">
    <h1 class="mb-4 text-4xl">{{ error?.statusCode || 500 }}</h1>
    <p>{{ error?.statusMessage || 'Something went wrong' }}</p>
    <NuxtLink to="/" class="mt-8 inline-block underline">Home</NuxtLink>
  </main>
</template>

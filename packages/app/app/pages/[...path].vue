<script setup lang="ts">
import {
  createRouteTable,
  resolveRoute,
  translationsFor,
  linkedRoute,
  type SiteData,
  type Seo,
} from '../../../../shared/cms';
import { pageQuery } from '../../sanity/queries';
import type { TypedObject } from '@portabletext/types';
import { CMS_CONTEXT } from '../composables/cms';

definePageMeta({ key: route => route.path });
const route = useRoute();
const { data: siteData, error: siteError } = await useCmsQuery();
if (siteError.value)
  throw createError({ statusCode: 503, statusMessage: 'CMS unavailable' });
if (!siteData.value?.website)
  throw createError({
    statusCode: 503,
    statusMessage: 'Run yarn setup to configure this website',
  });
const data = computed(() => siteData.value as SiteData);
const website = computed(() => data.value.website!);
const table = computed(() => createRouteTable(data.value));
const resolved = computed(() => resolveRoute(table.value, route.path));
if (resolved.value.redirect)
  await navigateTo(
    { path: resolved.value.redirect, query: route.query },
    { redirectCode: 301 }
  );
const current = computed(() => resolved.value.page);
if (!current.value && !resolved.value.redirect)
  throw createError({ statusCode: 404, statusMessage: 'Page not found' });
const language = computed(
  () => current.value?.language || website.value.defaultLanguage
);
provide(CMS_CONTEXT, { data, table, language });
interface Page {
  _id: string;
  title: string;
  language: string;
  content?: TypedObject[];
  seo?: Seo;
}
const {
  data: page,
  error: pageError,
  encodeDataAttribute,
} = await useSanityQuery<Page>(
  pageQuery,
  { id: computed(() => current.value?._id || '') },
  { key: `cms-page:${route.path}` }
);
if (pageError.value)
  throw createError({ statusCode: 503, statusMessage: 'CMS unavailable' });
if (!page.value && !resolved.value.redirect)
  throw createError({ statusCode: 404, statusMessage: 'Page not found' });
const alternates = computed(() =>
  current.value ? translationsFor(table.value, current.value) : []
);
const navigation = computed(() =>
  (website.value.navigation || []).flatMap(item => {
    const target = linkedRoute(table.value, item.page, language.value);
    return target
      ? [{ path: target.path, title: item.label || target.title }]
      : [];
  })
);
const home = computed(
  () =>
    table.value.routes.find(r => r.isHome && r.language === language.value)
      ?.path || '/'
);
const urlFor = useSanityUrlFor();
const imageUrl = (value: Seo['image']) =>
  value?.asset?._ref ? urlFor(value).width(1200).url() : undefined;
const base = computed(
  () => website.value.productionUrl?.replace(/\/$/, '') || ''
);
const siteConfig = () => ({
  url: website.value.productionUrl,
  name: website.value.title,
  _priority: 10,
});
if (import.meta.server) updateSiteConfig(siteConfig());
else
  watchEffect(onCleanup => {
    onCleanup(updateSiteConfig(siteConfig()));
  });
const title = computed(
  () =>
    page.value?.seo?.title ||
    [page.value?.title, website.value.seo?.title || website.value.title]
      .filter(Boolean)
      .join(' · ')
);
useSeoMeta({
  title,
  ogTitle: title,
  ogSiteName: () => website.value.title,
  ogUrl: () =>
    base.value ? base.value + (current.value?.path || '/') : undefined,
  description: () =>
    page.value?.seo?.description || website.value.seo?.description,
  ogDescription: () =>
    page.value?.seo?.description || website.value.seo?.description,
  ogImage: () => imageUrl(page.value?.seo?.image || website.value.seo?.image),
  robots: () =>
    page.value?.seo?.noIndex || website.value.seo?.noIndex
      ? 'noindex, nofollow'
      : 'index, follow',
});
useSchemaOrg([
  defineWebSite({
    '@id': () => `${base.value}/#website`,
    name: () => website.value.title,
    url: () => `${base.value}/`,
    inLanguage: language,
  }),
  defineWebPage({
    '@id': () => `${base.value}${current.value?.path || '/'}#webpage`,
    url: () => `${base.value}${current.value?.path || '/'}`,
    name: title,
    inLanguage: language,
    isPartOf: { '@id': () => `${base.value}/#website` },
  }),
]);
useHead({
  htmlAttrs: { lang: language },
  link: () => [
    ...(base.value && current.value
      ? [{ rel: 'canonical' as const, href: base.value + current.value.path }]
      : []),
    ...(base.value && website.value.languages.length > 1
      ? alternates.value.map(r => ({
          rel: 'alternate' as const,
          hreflang: r.language,
          href: base.value + r.path,
        }))
      : []),
    ...(website.value.icon?.asset?._ref
      ? [
          {
            rel: 'icon' as const,
            href: urlFor(website.value.icon).width(64).height(64).url(),
          },
        ]
      : []),
  ],
});
</script>

<template>
  <div v-if="page" class="mx-auto max-w-5xl px-6 py-8">
    <header class="mb-16 flex flex-wrap items-center justify-between gap-6">
      <NuxtLink :to="home" class="text-xl font-semibold">{{
        website.title
      }}</NuxtLink>
      <nav aria-label="Navigation" class="flex flex-wrap gap-6">
        <NuxtLink
          v-for="item in navigation"
          :key="item.path"
          :to="item.path"
          :aria-current="item.path === current?.path ? 'page' : undefined"
          >{{ item.title }}</NuxtLink
        >
      </nav>
      <nav
        v-if="website.languages.length > 1"
        aria-label="Languages"
        class="flex gap-3">
        <NuxtLink
          v-for="alternate in alternates"
          :key="alternate.language"
          :to="alternate.path"
          :hreflang="alternate.language"
          :lang="alternate.language"
          :aria-current="alternate.language === language ? 'page' : undefined"
          >{{
            website.languages.find(l => l.id === alternate.language)?.title
          }}</NuxtLink
        >
      </nav>
    </header>
    <main id="main">
      <h1
        class="mb-10 text-4xl font-semibold"
        :data-sanity="encodeDataAttribute?.('title')">
        {{ page.title }}
      </h1>
      <CmsContent
        :blocks="page.content || []"
        :data-sanity="encodeDataAttribute?.('content')" />
    </main>
    <footer class="mt-20 border-t border-current/15 pt-6 text-sm">
      {{ website.title }}
    </footer>
  </div>
</template>

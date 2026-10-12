import tailwindcss from '@tailwindcss/vite';
import {
  breakpoints,
  defaultBreakpoints,
  fallbackBreakpoint,
} from './config/breakpoints';

// Preview is opt-in and is never bundled into static production output.
const previewEnabled =
  process.env.NUXT_SANITY_PREVIEW === 'true' &&
  process.env.NUXT_BUILD_MODE !== 'static';
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      site: {
        url: process.env.NUXT_PUBLIC_SITE_URL || '',
        name: process.env.NUXT_PUBLIC_SITE_NAME || 'Nuxt 4 + Sanity',
      },
      sanity: {
        projectId: process.env.NUXT_PUBLIC_SANITY_PROJECT_ID || '',
        dataset: process.env.NUXT_PUBLIC_SANITY_DATASET || 'production',
        apiVersion: process.env.NUXT_PUBLIC_SANITY_API_VERSION || '2025-02-19',
        useCdn: false,
        apiHost:
          process.env.NUXT_PUBLIC_SANITY_API_HOST || 'https://api.sanity.io',
        useProjectHostname: !process.env.NUXT_PUBLIC_SANITY_API_HOST,
      },
    },
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxtjs/sanity',
    '@nuxtjs/seo',
    'nuxt-viewport',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
    '@hypernym/nuxt-gsap',
    '@vercel/analytics/nuxt',
  ],
  app: {
    head: {
      meta: [
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'msapplication-TileColor', content: '#ffffff' },
        { name: 'theme-color', content: '#ffffff' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png',
        },
        { rel: 'mask-icon', color: '#f2f7ee', href: '/safari-pinned-tab.svg' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
      ],
    },
  },
  pages: {},
  devtools: { enabled: true },
  typescript: {
    // typeCheck: true
    strict: true,
  },
  components: [
    { path: '~/components/app', pathPrefix: false },
    // { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/sanity', pathPrefix: false, prefix: 'sanity' },
    { path: '~/components', pathPrefix: true },
  ],
  experimental: {
    viewTransition: true,
    typedPages: true,
  },
  imports: {
    dirs: [
      './composables/**/*.{ts,js}',
      './stores/**/*.{ts,js}',
      './utils/**/*.{ts,js}',
    ],
  },
  css: ['~/assets/css/main.css', 'lenis/dist/lenis.css'],
  nitro: {
    prerender: {
      crawlLinks: process.env.NUXT_BUILD_MODE === 'static',
      failOnError: true,
    },
  },
  image: {
    provider: 'sanity',
    // This will be set from the local module using runtime config variables
    // sanity: {
    //   projectId: sanityConfig.projectId,
    //   dataset: sanityConfig.dataset,
    // },
    screens: breakpoints,
  },
  gsap: {
    provide: true,
    composables: false,
    extraPlugins: {
      scrollTo: true,
      scrollTrigger: true,
    },
    clubPlugins: {
      // scrollSmoother: true, // Replace with Lenis
    },
  },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: ['/preview/**'],
    autoI18n: false,
  },
  ogImage: { enabled: false },
  schemaOrg: { defaults: false },
  site: {
    trailingSlash: false,
    indexable: !previewEnabled,
  },
  sanity: {
    apiVersion: '2025-02-19',
    perspective: 'published',
    useCdn: false,
    ...(previewEnabled
      ? {
          visualEditing: {
            token: process.env.NUXT_SANITY_VISUAL_EDITING_TOKEN || '',
            studioUrl:
              process.env.NUXT_SANITY_VISUAL_EDITING_STUDIO_URL ||
              'http://localhost:3333',
            mode: 'live-visual-editing',
            stega: false,
            previewMode: {
              enable: '/preview/enable',
              disable: '/preview/disable',
            },
          },
        }
      : {}),
  },
  viewport: {
    breakpoints,
    defaultBreakpoints,
    fallbackBreakpoint,
  },
  pwa: {
    disable: previewEnabled || process.env.NUXT_ENABLE_PWA !== 'true',
    strategies: 'generateSW',
    registerType: 'autoUpdate',
    // mode: 'development',
    experimental: {
      enableWorkboxPayloadQueryParams: true,
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,webp,jpg,svg,gif,ico,woff,woff2}'],
      navigateFallbackDenylist: [
        /^\/api\//,
        /^\/preview\//,
        /^\/_sanity\//,
        /\/sitemap.xml/,
        /\/robots.txt/,
        /\/__sitemap__\//,
      ],
      cleanupOutdatedCaches: true,
    },
    manifest: {
      name: process.env.NUXT_PUBLIC_SITE_NAME || 'Website',
      short_name: process.env.NUXT_PUBLIC_SITE_NAME || 'Website',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
  },
  // Dependency CSS must use the application's browser targets, not unpublished
  // development-only Browserslist configs shipped by preview packages.
  postcss: {
    plugins: {
      autoprefixer: { overrideBrowserslist: ['defaults'] },
      cssnano: { preset: ['default', { overrideBrowserslist: ['defaults'] }] },
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['@sanity/client', 'lenis'],
      include: ['@sanity/image-url'],
    },
  },
  compatibilityDate: '2025-07-15',
});

// declare module '#app' {
//   interface PageMeta {
//     slug?: string | null; // Extend route.meta params for TypeScript
//   }
// }

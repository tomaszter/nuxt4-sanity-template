import {
  breakpoints,
  defaultBreakpoints,
  fallbackBreakpoint,
} from './config/breakpoints';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      site: {
        url: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.example.com',
        name: process.env.NUXT_PUBLIC_SITE_NAME || 'Nuxt 4 + Sanity',
      },
      sanity: {
        projectId: process.env.NUXT_PUBLIC_SANITY_PROJECT_ID || '',
        dataset: process.env.NUXT_PUBLIC_SANITY_DATASET || 'production',
        apiVersion: process.env.NUXT_PUBLIC_SANITY_API_VERSION || '2023-03-14',
        useCdn: true,
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
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
    '@hypernym/nuxt-gsap',
  ],
  app: {
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
  css: ['lenis/dist/lenis.css'], // Import lenis css
  nitro: {
    prerender: {
      crawlLinks: true,
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
    experimentalCompression: true,
    defaults: {
      lastmod: new Date().toISOString().slice(0, 10),
    },
  },
  site: {
    trailingSlash: false,
  },
  sanity: {},
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    viewer: true,
    config: './tailwind.config.ts',
    exposeConfig: false,
  },
  viewport: {
    breakpoints,
    defaultBreakpoints,
    fallbackBreakpoint,
  },
  pwa: {
    strategies: 'generateSW',
    registerType: 'autoUpdate',
    // mode: 'development',
    experimental: {
      enableWorkboxPayloadQueryParams: true,
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,webp,jpg,svg,gif,ico,woff,woff2}'],
      navigateFallbackDenylist: [
        /\/sitemap.xml/,
        /\/robots.txt/,
        /\/__sitemap__\//,
      ],
      cleanupOutdatedCaches: true,
    },
    manifest: {
      name: process.env.NUXT_PUBLIC_SITE_NAME || 'Raumkonzept Schweiz',
      short_name: process.env.NUXT_PUBLIC_SITE_NAME || 'Raumkonzept Schweiz',
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
  vite: {
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

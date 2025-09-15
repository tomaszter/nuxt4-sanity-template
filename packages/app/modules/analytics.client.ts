import { defineNuxtModule, addComponent, extendViteConfig } from 'nuxt/kit';

export default defineNuxtModule({
  meta: { name: 'vercel-analytics-component' },
  setup: () => {
    extendViteConfig(config => {
      config.optimizeDeps ||= {};
      config.optimizeDeps.exclude ||= [];
      config.optimizeDeps.exclude.push('@vercel/analytics/nuxt');
    });

    addComponent({
      name: 'VercelAnalytics',
      export: 'Analytics',
      filePath: '@vercel/analytics/nuxt',
    });
  },
});

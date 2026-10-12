import { createClient } from '@sanity/client';
import {
  addPrerenderRoutes,
  defineNuxtModule,
  extendRouteRules,
} from 'nuxt/kit';
import { updateSiteConfig } from 'nuxt-site-config/kit';
import {
  createRouteTable,
  siteQuery,
  type SiteData,
} from '../../../shared/cms';

export default defineNuxtModule({
  meta: { name: 'cms-routes' },
  setup(_, nuxt) {
    // No CMS access during install/prepare or SSR build. Draft routes resolve at request time.
    nuxt.hook('modules:done', async () => {
      if (
        nuxt.options.dev ||
        nuxt.options._prepare ||
        !nuxt.options.nitro.static
      )
        return;
      const config = nuxt.options.runtimeConfig.public.sanity;
      if (!config.projectId)
        throw new Error('Run yarn setup before generating the website.');
      const client = createClient({
        ...config,
        apiVersion: '2025-02-19',
        perspective: 'published',
        useCdn: false,
      });
      const data = await client.fetch<SiteData>(siteQuery);
      const table = createRouteTable(data, true);
      if (!data.website?.productionUrl)
        throw new Error(
          'Set the production domain in Sanity → Website before generating.'
        );
      updateSiteConfig(
        {
          _context: 'cms-routes',
          url: data.website.productionUrl,
          name: data.website.title,
        },
        nuxt
      );
      addPrerenderRoutes(table.routes.map(route => route.path));
      for (const [from, to] of Object.entries(table.redirects)) {
        extendRouteRules(from, { redirect: { to, statusCode: 301 } });
        // Generates portable HTML redirects as well as provider-specific rules.
        addPrerenderRoutes(from);
      }
    });
  },
});

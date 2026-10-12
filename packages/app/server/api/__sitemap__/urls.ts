import { createClient } from '@sanity/client';
import {
  createRouteTable,
  siteQuery,
  translationsFor,
  type SiteData,
} from '../../../../../shared/cms';

export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig().public.sanity;
  const client = createClient({
    ...config,
    apiVersion: '2025-02-19',
    perspective: 'published',
    useCdn: false,
  });
  const data = await client.fetch<SiteData>(siteQuery);
  const table = createRouteTable(data, true);
  const base = data.website?.productionUrl?.replace(/\/$/, '');
  if (!base)
    throw createError({
      statusCode: 503,
      statusMessage: 'Configure the production domain in Sanity',
    });
  if (data.website?.seo?.noIndex) return [];
  return table.routes
    .filter(route => !route.noIndex)
    .map(route => ({
      loc: base + route.path,
      lastmod: route._updatedAt,
      alternatives:
        data.website!.languages.length > 1
          ? translationsFor(table, route)
              .filter(r => !r.noIndex)
              .map(r => ({ hreflang: r.language, href: base + r.path }))
          : [],
    }));
});

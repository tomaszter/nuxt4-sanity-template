import {
  siteQuery,
  type RouteTable,
  type SiteData,
} from '../../../../shared/cms';
import type { ComputedRef } from 'vue';
export const CMS_CONTEXT = Symbol('cms');
export interface CmsContext {
  data: ComputedRef<SiteData>;
  table: ComputedRef<RouteTable>;
  language: ComputedRef<string>;
}
export function useCms() {
  const context = inject<CmsContext>(CMS_CONTEXT);
  if (!context) throw new Error('CMS context is missing.');
  return context;
}
export function useCmsQuery() {
  return useSanityQuery<SiteData>(
    siteQuery,
    {},
    { key: 'cms-website', queryOptions: { stega: false } }
  );
}

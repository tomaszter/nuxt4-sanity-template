/** Shared by Studio, Nuxt and the static build. No framework or network dependencies. */
export interface Reference {
  _ref: string;
}
export interface Language {
  id: string;
  title: string;
  home?: Reference;
}
export interface Seo {
  title?: string;
  description?: string;
  noIndex?: boolean;
  image?: { asset?: Reference };
}
export interface Website {
  _id: string;
  title: string;
  productionUrl?: string;
  previewUrl?: string;
  languages: Language[];
  defaultLanguage: string;
  seo?: Seo;
  icon?: { asset?: Reference };
  navigation?: { _key: string; page?: Reference; label?: string }[];
}
export interface PageRoute {
  _id: string;
  _updatedAt?: string;
  title: string;
  language: string;
  slug?: string;
  translationKey?: string;
  previousPaths?: string[];
  noIndex?: boolean;
}
export interface SiteData {
  website: Website | null;
  pages: PageRoute[];
}
export interface CmsRoute extends PageRoute {
  path: string;
  isHome: boolean;
}
export interface RouteTable {
  routes: CmsRoute[];
  redirects: Record<string, string>;
}
export const publishedId = (id: string) => id.replace(/^drafts\./, "");
export const languagePattern = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
export const slugPattern =
  /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
const reserved = new Set([
  "api",
  "preview",
  "_nuxt",
  "_ipx",
  "_sanity",
  "__sitemap__",
  "sitemap.xml",
  "robots.txt",
]);
export function normalizePath(path: string): string {
  return (
    "/" +
    path.split("?")[0]!.split("#")[0]!.split("/").filter(Boolean).join("/")
  );
}
export function validateSlug(slug: string, languages: Language[]): boolean {
  const first = slug.split("/")[0]!;
  return (
    slugPattern.test(slug) &&
    !reserved.has(first) &&
    !languages.some((l) => l.id.toLowerCase() === first)
  );
}
export function createRouteTable(data: SiteData, strict = false): RouteTable {
  const { website, pages } = data;
  if (!website)
    throw new Error("Website settings are missing. Run yarn setup.");
  const languages = website.languages || [];
  if (
    !languages.length ||
    languages.some((l) => !languagePattern.test(l.id) || reserved.has(l.id)) ||
    new Set(languages.map((l) => l.id)).size !== languages.length
  )
    throw new Error("Configure unique, valid website languages.");
  if (!languages.some((l) => l.id === website.defaultLanguage))
    throw new Error("The default language must be active.");
  const multilingual = languages.length > 1;
  const routes: CmsRoute[] = [];
  const seen = new Set<string>();
  const translations = new Set<string>();
  for (const page of pages) {
    const language = languages.find((l) => l.id === page.language);
    if (!language) continue;
    const isHome =
      !!language.home &&
      publishedId(language.home._ref) === publishedId(page._id);
    if (!isHome && !page.slug) {
      if (strict) throw new Error(`Page "${page.title}" has no slug.`);
      continue;
    }
    if (!isHome && !validateSlug(page.slug!, languages))
      throw new Error(`Invalid or reserved slug: ${page.slug}`);
    const path = normalizePath(
      `${multilingual ? language.id : ""}/${isHome ? "" : page.slug}`,
    );
    if (seen.has(path)) throw new Error(`Duplicate page path: ${path}`);
    seen.add(path);
    if (page.translationKey) {
      const key = `${page.language}:${page.translationKey}`;
      if (translations.has(key))
        throw new Error(
          `Duplicate translation in ${page.language}: ${page.translationKey}`,
        );
      translations.add(key);
    }
    routes.push({ ...page, _id: publishedId(page._id), path, isHome });
  }
  if (strict)
    for (const language of languages) {
      if (!routes.some((r) => r.language === language.id && r.isHome))
        throw new Error(`Publish and assign a home page for ${language.id}.`);
    }
  const redirects: Record<string, string> = {};
  function alias(from: string, to: string, explicit = false) {
    const path = normalizePath(from);
    if (path === to) return;
    if (seen.has(path)) {
      if (explicit) throw new Error(`Redirect conflicts with a page: ${path}`);
      return;
    }
    if (redirects[path] && redirects[path] !== to)
      throw new Error(`Conflicting redirect: ${path}`);
    redirects[path] = to;
  }
  for (const route of routes) {
    // Preserve the surviving language's URLs when switching mono <-> multilingual.
    if (!multilingual)
      alias(
        `/${route.language}${route.path === "/" ? "" : route.path}`,
        route.path,
      );
    else if (route.language === website.defaultLanguage)
      alias(route.isHome ? "/" : `/${route.slug}`, route.path);
    for (const previous of route.previousPaths || []) {
      if (
        !previous.startsWith("/") ||
        previous.startsWith("//") ||
        /[?#\\]/.test(previous) ||
        reserved.has(previous.split("/")[1]!)
      )
        throw new Error(`Invalid previous path: ${previous}`);
      alias(previous, route.path, true);
    }
  }
  return { routes, redirects };
}
export function resolveRoute(table: RouteTable, path: string) {
  const normalized = normalizePath(path);
  const page = table.routes.find((r) => r.path === normalized);
  return {
    page,
    redirect: page
      ? normalized !== path
        ? normalized
        : undefined
      : table.redirects[normalized],
  };
}
export function translationsFor(table: RouteTable, page: CmsRoute) {
  return table.routes.filter((r) =>
    page.isHome
      ? r.isHome
      : !!page.translationKey && r.translationKey === page.translationKey,
  );
}
export function linkedRoute(
  table: RouteTable,
  reference: Reference | undefined,
  language: string,
) {
  const original = table.routes.find(
    (r) => r._id === publishedId(reference?._ref || ""),
  );
  if (!original) return undefined;
  return original.language === language
    ? original
    : translationsFor(table, original).find((r) => r.language === language);
}
// Metadata only: page bodies are fetched separately, not shipped for every route.
export const siteQuery = `{
  "website": *[_type == "website" && _id == "website"][0]{_id,title,productionUrl,previewUrl,languages,defaultLanguage,seo,icon,navigation},
  "pages": *[_type == "page"]{_id,_updatedAt,title,language,"slug":slug.current,translationKey,previousPaths,"noIndex":seo.noIndex}
}`;

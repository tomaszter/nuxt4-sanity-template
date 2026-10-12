import type {DocumentLocationResolver, DocumentResolver} from 'sanity/presentation'
import {map} from 'rxjs'
import {createRouteTable, publishedId, siteQuery, type SiteData} from '../../../../shared/cms'

export const locations: DocumentLocationResolver = ({id, type}, {documentStore}) => {
  if (type !== 'page') return null
  return documentStore.listenQuery(siteQuery, {}, {perspective: 'drafts'}).pipe(
    map((value) => {
      try {
        const route = createRouteTable(value as SiteData).routes.find(
          (page) => page._id === publishedId(id),
        )
        return route
          ? {locations: [{title: route.title || route.path, href: route.path}]}
          : {locations: [], message: 'Sprache, URL und Home-Zuweisung prüfen.'}
      } catch {
        return {locations: [], message: 'Website-Einstellungen vervollständigen.'}
      }
    }),
  )
}
// The same URL policy expressed as a GROQ filter for Presentation's main document lookup.
export const mainDocuments: DocumentResolver[] = [
  {
    route: '/:path(.*)',
    resolve: ({params}) => ({
      filter: `_type == "page" && (
      (count(*[_id == "website"][0].languages) == 1 && language == *[_id == "website"][0].defaultLanguage &&
        (($path == "" && _id == *[_id == "website"][0].languages[0].home._ref) || ($path != "" && slug.current == $path))) ||
      (count(*[_id == "website"][0].languages) > 1 && language == $language &&
        (($slug == "" && _id in *[_id == "website"][0].languages[id == $language].home._ref) || ($slug != "" && slug.current == $slug)))
    )`,
      params: {
        path: params.path || '',
        language: (params.path || '').split('/')[0] || '',
        slug: (params.path || '').split('/').slice(1).join('/'),
      },
    }),
  },
]

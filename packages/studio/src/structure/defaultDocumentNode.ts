import {joinURL, withQuery} from 'ufo'
import {type DefaultDocumentNodeContext, type DefaultDocumentNodeResolver} from 'sanity/structure'
import {Iframe, type IframeOptions} from 'sanity-plugin-iframe-pane'
import {type SanityDocument, isReference, isSlug} from 'sanity'
import {domain} from '@/config/domains'

const routesWithPreview = ['main', 'route', 'libraryRoute', 'hiddenOverviewRoute', 'hiddenRoute']

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, context) => {
  if (routesWithPreview.includes(context.schemaType)) {
    return S.document().views([
      S.view.form(),
      S.view
        .component(Iframe)
        .options({
          url: (document) => getPreviewUrl(document, context),
          showDisplayUrl: false,
          reload: {
            button: false,
            // revision: true,
          },
          loader: false,
          attributes: {
            allow: 'fullscreen', // string, optional
            referrerPolicy: 'strict-origin-when-cross-origin', // string, optional
            sandbox: 'allow-same-origin allow-scripts', // string, optional
          },
        } as IframeOptions)
        .title('Preview'),
    ])
  }
  return S.document().views([S.view.form()])
}

// Customise this function to show the correct URL based on the current document and it's parents
async function getPreviewUrl(document: SanityDocument | null, context: DefaultDocumentNodeContext) {
  if (!document) {
    return null
  }

  const getTraversedPath = async (document: SanityDocument) => {
    const slugs: string[] = []
    const visited = new Set<string>() // Prevent infinite loops

    const client = context.getClient({apiVersion: '2021-10-21'})

    const getParentSlug = async (doc: SanityDocument) => {
      // Prevent infinite recursion
      if (visited.has(doc._id)) {
        return
      }
      visited.add(doc._id)

      // Add current document's slug
      const slug = isSlug(doc.slug) ? doc.slug.current : null
      if (slug) {
        slugs.unshift(slug) // Add to beginning to maintain hierarchy order
      }

      // Recursively process parent
      if (isReference(doc.parent)) {
        try {
          const parentDoc = await client.getDocument(doc.parent._ref)
          if (parentDoc) {
            await getParentSlug(parentDoc)
          }
        } catch (error) {
          console.warn(`Failed to fetch parent document ${doc.parent._ref}:`, error)
        }
      }
    }

    await getParentSlug(document)

    return slugs.join('/')
  }

  try {
    const path = await getTraversedPath(document)
    console.log(path)

    return path
      ? withQuery(joinURL(domain, '/', path), {preview: true})
      : withQuery(domain, {preview: true})
  } catch (error) {
    console.warn('Something went wrong while generating preview URL:', error)
    // Fallback to domain only
    return withQuery(domain, {preview: true})
  }
}

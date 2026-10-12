import type {StructureResolver} from 'sanity/structure'
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Inhalte')
    .items([
      S.documentTypeListItem('page').title('Seiten'),
      S.divider(),
      S.listItem()
        .title('Website')
        .id('website')
        .child(S.document().schemaType('website').documentId('website')),
    ])
export {defaultDocumentNode} from './defaultDocumentNode'

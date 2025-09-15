import type {StructureBuilder, StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S: StructureBuilder) =>
  S.list().title('Start').items([])

export {defaultDocumentNode} from './defaultDocumentNode'

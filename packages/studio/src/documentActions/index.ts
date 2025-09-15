import type {DocumentActionComponent, DocumentActionsContext} from 'sanity'

const updatePublishSchemaTypes: string[] = []

const publishOnlyActions: NonNullable<DocumentActionComponent['action']>[] = [
  'publish',
  'discardChanges',
  'restore',
  'delete',
  'unpublish',
  'unpublishVersion',
  'discardVersion',
  'duplicate',
]

export function resolveDocumentActions(
  prev: DocumentActionComponent[],
  context: DocumentActionsContext,
): DocumentActionComponent[] {
  if (updatePublishSchemaTypes.includes(context.schemaType)) {
    return prev.filter(({action}) => {
      return action && publishOnlyActions.includes(action)
    })
  }

  return prev
}

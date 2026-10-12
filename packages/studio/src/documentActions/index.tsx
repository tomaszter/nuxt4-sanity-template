import {useEffect, useState} from 'react'
import {Button, Stack, Text} from '@sanity/ui'
import {useClient, type DocumentActionComponent, type DocumentActionsResolver} from 'sanity'
import type {Language} from '../../../../shared/cms'

const TranslateAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion: '2025-02-19'})
  const [open, setOpen] = useState(false)
  const [languages, setLanguages] = useState<Language[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const source = props.draft || props.published
  useEffect(() => {
    if (!open) return
    let active = true
    void client
      .fetch<Language[]>('*[_id in ["website", "drafts.website"]] | order(_id asc)[0].languages')
      .then((value) => {
        if (active) setLanguages(value || [])
      })
    return () => {
      active = false
    }
  }, [client, open])
  return {
    label: 'Übersetzung anlegen',
    disabled: !source,
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'dialog',
      header: 'Zielsprache wählen',
      onClose: () => {
        setOpen(false)
        props.onComplete()
      },
      content: (
        <Stack gap={3}>
          {languages
            .filter((l) => l.id !== source?.language)
            .map((language) => (
              <Button
                key={language.id}
                text={language.title}
                disabled={busy}
                onClick={async () => {
                  if (!source) return
                  setBusy(true)
                  setError('')
                  try {
                    const key = String(source.translationKey || props.id)
                    const existing = await client
                      .withConfig({perspective: 'raw'})
                      .fetch(
                        'count(*[_type == "page" && translationKey == $key && language == $language])',
                        {key, language: language.id},
                      )
                    if (existing)
                      throw new Error('Für diese Sprache existiert bereits eine Übersetzung.')
                    const {_id, _rev, _createdAt, _updatedAt, previousPaths, ...fields} = source
                    void _id
                    void _rev
                    void _createdAt
                    void _updatedAt
                    void previousPaths
                    const id = `drafts.${crypto.randomUUID()}`
                    await client.create({
                      ...fields,
                      _id: id,
                      _type: 'page',
                      language: language.id,
                      translationKey: key,
                    })
                    setOpen(false)
                    props.onComplete()
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : 'Übersetzung konnte nicht angelegt werden.',
                    )
                  } finally {
                    setBusy(false)
                  }
                }}
              />
            ))}
          {error && <Text>{error}</Text>}
          <Text size={1}>
            Die neue Seite erscheint als Entwurf unter Seiten. Text und URL anschliessend
            übersetzen.
          </Text>
        </Stack>
      ),
    },
  }
}
export const resolveDocumentActions: DocumentActionsResolver = (actions, context) => {
  if (context.schemaType === 'website')
    return actions.filter(
      (action) => !['duplicate', 'delete', 'unpublish'].includes(action.action || ''),
    )
  return context.schemaType === 'page' ? [...actions, TranslateAction] : actions
}

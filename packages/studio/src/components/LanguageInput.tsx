import {useEffect, useState} from 'react'
import {Select, Stack, Text} from '@sanity/ui'
import {set, unset, useClient, type StringInputProps} from 'sanity'
import type {Language} from '../../../../shared/cms'

export function LanguageInput(props: StringInputProps) {
  const client = useClient({apiVersion: '2025-02-19'})
  const [languages, setLanguages] = useState<Language[]>([])
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    const refresh = () =>
      client
        .fetch<Language[]>('*[_id in ["website", "drafts.website"]] | order(_id asc)[0].languages')
        .then((value) => {
          if (active) {
            setLanguages(value || [])
            setError(false)
          }
        })
        .catch(() => {
          if (active) setError(true)
        })
    void refresh()
    const subscription = client.listen('*[_id in ["website", "drafts.website"]]').subscribe({
      next: () => {
        void refresh()
      },
      error: () => {
        if (active) setError(true)
      },
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client])
  return (
    <Stack gap={2}>
      <Select
        {...props.elementProps}
        value={props.value || ''}
        disabled={props.readOnly}
        onChange={(event) =>
          props.onChange(event.currentTarget.value ? set(event.currentTarget.value) : unset())
        }
      >
        <option value="">Sprache wählen</option>
        {languages.map((language) => (
          <option key={language.id} value={language.id}>
            {language.title} ({language.id})
          </option>
        ))}
      </Select>
      {error && <Text size={1}>Sprachen konnten nicht geladen werden. Verbindung prüfen.</Text>}
      {!error && !languages.length && <Text size={1}>Zuerst Sprachen unter Website anlegen.</Text>}
    </Stack>
  )
}

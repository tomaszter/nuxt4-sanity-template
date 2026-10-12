import {defineArrayMember, defineField, defineType} from 'sanity'
import {LanguageInput} from '../components/LanguageInput'
import {
  createRouteTable,
  languagePattern,
  publishedId,
  siteQuery,
  validateSlug,
  type SiteData,
  type Website,
} from '../../../../shared/cms'

const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'SEO-Titel', type: 'string'}),
    defineField({name: 'description', title: 'Beschreibung', type: 'text', rows: 3}),
    defineField({
      name: 'image',
      title: 'Social-Media-Bild',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'noIndex',
      title: 'Von Suchmaschinen ausschliessen',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
const website = defineType({
  name: 'website',
  title: 'Website',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Website-Name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'productionUrl',
      title: 'Öffentliche Domain',
      type: 'url',
      description: 'Vor dem Produktions-Build setzen, z. B. https://example.com',
      validation: (r) => r.uri({scheme: ['https', 'http']}),
    }),
    defineField({
      name: 'previewUrl',
      title: 'Preview-Domain',
      type: 'url',
      description: 'Lokal standardmässig http://localhost:3000',
      validation: (r) => r.uri({scheme: ['https', 'http']}),
    }),
    defineField({
      name: 'languages',
      title: 'Aktive Sprachen',
      type: 'array',
      validation: (r) => r.required().min(1),
      of: [
        defineArrayMember({
          name: 'language',
          type: 'object',
          fields: [
            defineField({
              name: 'id',
              title: 'Sprachcode',
              type: 'string',
              description:
                'Zum Beispiel de, en oder fr-CH. Nach Veröffentlichung nicht umbenennen.',
              validation: (r) => r.required().regex(languagePattern),
            }),
            defineField({
              name: 'title',
              title: 'Bezeichnung',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'home',
              title: 'Startseite',
              type: 'reference',
              to: [{type: 'page'}],
              validation: (r) => r.required(),
            }),
          ],
          preview: {select: {title: 'title', subtitle: 'id'}},
        }),
      ],
    }),
    defineField({
      name: 'defaultLanguage',
      title: 'Standardsprache',
      type: 'string',
      components: {input: LanguageInput},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'navigation',
      title: 'Navigation',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'navigationLink',
          type: 'object',
          fields: [
            defineField({
              name: 'page',
              title: 'Seite',
              type: 'reference',
              to: [{type: 'page'}],
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'label',
              title: 'Abweichender Titel',
              type: 'string',
              description: 'Optional. Ohne Angabe wird der übersetzte Seitentitel verwendet.',
            }),
          ],
          preview: {select: {title: 'page.title', subtitle: 'label'}},
        }),
      ],
    }),
    defineField({name: 'seo', title: 'Globale SEO-Vorgaben', type: 'seo'}),
    defineField({name: 'icon', title: 'Website-Icon', type: 'image'}),
  ],
  validation: (rule) =>
    rule.custom(async (value, context) => {
      if (!value) return true
      const settings = value as unknown as Website
      try {
        const client = context
          .getClient({apiVersion: '2025-02-19'})
          .withConfig({perspective: 'published', useCdn: false})
        const data = await client.fetch<SiteData>(siteQuery)
        createRouteTable({...data, website: settings}, true)
        if (settings.productionUrl && new URL(settings.productionUrl).pathname !== '/')
          return 'Die öffentliche Domain darf keinen Unterpfad enthalten.'
        return true
      } catch (error) {
        return error instanceof Error ? error.message : 'Routing prüfen.'
      }
    }),
})
const page = defineType({
  name: 'page',
  title: 'Seite',
  type: 'document',
  initialValue: async (_, context) => ({
    language: await context
      .getClient({apiVersion: '2025-02-19'})
      .fetch('*[_id == "website"][0].defaultLanguage'),
    translationKey: crypto.randomUUID(),
  }),
  fields: [
    defineField({name: 'title', title: 'Titel', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'language',
      title: 'Sprache',
      type: 'string',
      components: {input: LanguageInput},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL-Pfad',
      type: 'slug',
      options: {source: 'title'},
      description:
        'Z. B. kontakt oder angebot/beratung. Die zugewiesene Home verwendet automatisch /.',
      validation: (r) =>
        r.custom(async (value, context) => {
          const website = await context
            .getClient({apiVersion: '2025-02-19'})
            .fetch<Website | null>('*[_id in ["website", "drafts.website"]] | order(_id asc)[0]')
          const isHome = website?.languages?.some(
            (l) => publishedId(l.home?._ref || '') === publishedId(context.document?._id || ''),
          )
          if (isHome) return true
          return value?.current && validateSlug(value.current, website?.languages || [])
            ? true
            : 'Einen gültigen Pfad ohne Sprachpräfix angeben.'
        }),
    }),
    defineField({
      name: 'translationKey',
      title: 'Übersetzungsgruppe',
      type: 'string',
      description:
        'Übersetzungen teilen denselben Schlüssel. Mit „Übersetzung anlegen“ automatisch übernehmen.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'content',
      title: 'Inhalt',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                title: 'Externer Link',
                type: 'object',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    validation: (r) => r.uri({scheme: ['http', 'https', 'mailto', 'tel']}),
                  },
                ],
              },
              {
                name: 'internalLink',
                title: 'Interner Link',
                type: 'object',
                fields: [{name: 'page', type: 'reference', to: [{type: 'page'}]}],
              },
            ],
          },
        }),
        defineArrayMember({
          name: 'contentImage',
          title: 'Bild',
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternativtext',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({name: 'caption', title: 'Bildlegende', type: 'string'}),
          ],
        }),
      ],
    }),
    defineField({name: 'seo', title: 'SEO', type: 'seo'}),
    defineField({
      name: 'previousPaths',
      title: 'Frühere URLs',
      type: 'array',
      of: [{type: 'string'}],
      description:
        'Absolute Pfade wie /alte-seite. Sprachpräfix-Wechsel werden automatisch berücksichtigt.',
    }),
  ],
  preview: {select: {title: 'title', subtitle: 'language'}},
  validation: (rule) =>
    rule.custom(async (value, context) => {
      if (!value) return true
      const document = value as Record<string, unknown>
      const client = context
        .getClient({apiVersion: '2025-02-19'})
        .withConfig({perspective: 'drafts', useCdn: false})
      const data = await client.fetch<SiteData>(siteQuery)
      if (!data.website?.languages?.some((l) => l.id === document.language))
        return 'Eine aktive Website-Sprache wählen.'
      const id = publishedId(String(document._id))
      const route = {
        _id: id,
        title: String(document.title || ''),
        language: String(document.language || ''),
        slug: (document.slug as {current?: string})?.current,
        translationKey: document.translationKey as string,
        previousPaths: document.previousPaths as string[],
      }
      try {
        createRouteTable({
          ...data,
          pages: [...data.pages.filter((p) => publishedId(p._id) !== id), route],
        })
        return true
      } catch (error) {
        return error instanceof Error ? error.message : 'Routing prüfen.'
      }
    }),
})
export const schemaTypes = [website, page, seo]

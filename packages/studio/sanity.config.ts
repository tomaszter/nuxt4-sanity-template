import {defineConfig, isDev, type PluginOptions} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {resolveDocumentActions} from '@/documentActions'
import {schemaTypes} from '@/schemaTypes'
import {presentationTool} from 'sanity/presentation'
import {locations, mainDocuments} from './src/presentation'
import {media} from 'sanity-plugin-media'
import {structure, defaultDocumentNode} from '@/structure'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'unconfigured'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

const devOnlyPlugins: PluginOptions[] = [visionTool()]
const prodOnlyPlugins: PluginOptions[] = []

export default defineConfig({
  name: 'default',
  title: process.env.SANITY_STUDIO_TITLE || 'Website Studio',

  projectId,
  dataset,

  plugins: [
    structureTool({defaultDocumentNode, structure}),
    media(),
    presentationTool({
      previewUrl: {
        initial: async ({client, origin}) =>
          origin.startsWith('http://localhost:')
            ? process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3000'
            : (await client.fetch<string>('*[_id == "website"][0].previewUrl')) ||
              process.env.SANITY_STUDIO_PREVIEW_URL ||
              'http://localhost:3000',
        previewMode: {enable: '/preview/enable', disable: '/preview/disable'},
      },
      resolve: {locations, mainDocuments},
    }),
    ...(isDev ? devOnlyPlugins : prodOnlyPlugins),
  ],

  document: {
    actions: resolveDocumentActions,
  },

  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter((template) => template.schemaType !== 'website'),
  },
})

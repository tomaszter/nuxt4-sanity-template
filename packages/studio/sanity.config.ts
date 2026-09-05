import {defineConfig, isDev, type PluginOptions} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {resolveDocumentActions} from '@/documentActions'
import {schemaTypes} from '@/schemaTypes'
import {media} from 'sanity-plugin-media'
import {structure, defaultDocumentNode} from '@/structure'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'vds3trhr'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

const devOnlyPlugins: PluginOptions[] = [visionTool()]
const prodOnlyPlugins: PluginOptions[] = []

export default defineConfig({
  name: 'default',
  title: 'nuxt4-sanity-template-studio',

  projectId,
  dataset,

  plugins: [
    structureTool({defaultDocumentNode, structure}),
    media(),
    ...(isDev ? devOnlyPlugins : prodOnlyPlugins),
  ],

  document: {
    actions: resolveDocumentActions,
  },

  schema: {
    types: schemaTypes,
  },
})

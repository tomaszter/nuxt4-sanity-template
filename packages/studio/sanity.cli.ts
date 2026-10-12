import {defineCliConfig} from 'sanity/cli'
import {fileURLToPath, URL} from 'node:url'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'unconfigured'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  // Visit https://www.sanity.io/docs/environment-variables
  // to learn more about using environment variables for local & production.
  studioHost: process.env.SANITY_STUDIO_STUDIO_HOST || undefined,
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  deployment: {
    autoUpdates: false,
  },
  typegen: {
    path: '../app/sanity/queries/**/*.{ts,js}',
    schema: 'schema.json',
    generates: '../app/sanity/types.ts',
    overloadClientMethods: true,
  },
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['ufo'],
    },
  },
})

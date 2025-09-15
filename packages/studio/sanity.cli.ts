import {defineCliConfig} from 'sanity/cli'
import {fileURLToPath, URL} from 'node:url'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'vds3trhr'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  // Visit https://www.sanity.io/docs/environment-variables
  // to learn more about using environment variables for local & production.
  studioHost: process.env.SANITY_STUDIO_STUDIO_HOST || 'test',
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  autoUpdates: false,
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

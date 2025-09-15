import { defineNuxtModule } from 'nuxt/kit';

// This module extends @nuxt/image 'sanity' provider options with runtime config
// to not duplicate sanity config into the image module
export default defineNuxtModule({
  meta: { name: 'extend-sanity-provider' },
  setup(_, nuxt) {
    const opts = nuxt.options.runtimeConfig.public.sanity;
    //   Set provider to 'sanity' if it's 'ipx' by default
    nuxt.options.image.provider =
      nuxt.options.image.provider === 'ipx'
        ? 'sanity'
        : nuxt.options.image.provider;

    nuxt.options.image.sanity ||= {};
    nuxt.options.image.sanity.projectId = opts.projectId;
    nuxt.options.image.sanity.dataset = opts.dataset;
  },
});

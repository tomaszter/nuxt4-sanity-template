/**
 * Shortcut for calling `$urlFor()` from plugin
 */
export function useSanityUrlFor() {
  return useNuxtApp().$urlFor;
}

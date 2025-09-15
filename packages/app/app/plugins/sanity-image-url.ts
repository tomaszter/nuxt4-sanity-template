import imageUrlBuilder from '@sanity/image-url';
import type {
  SanityClientLike,
  SanityImageSource,
} from '@sanity/image-url/lib/types/types';

export default defineNuxtPlugin({
  name: 'sanity-image-url',
  setup: () => {
    const builder = imageUrlBuilder(useSanity().config as SanityClientLike);
    function urlFor(source: SanityImageSource) {
      return builder.image(source).auto('format');
    }
    return {
      provide: { urlFor },
    };
  },
});

import { SanityEmailLinkSerializer } from '#components';
import type { PortableTextComponentProps } from '@portabletext/vue';

// https://sanity.nuxtjs.org/helpers/portable-text
export const components = {
  marks: {
    emailLink: (
      props: PortableTextComponentProps<
        InstanceType<typeof SanityEmailLinkSerializer>['$props']
      >
    ) => h(SanityEmailLinkSerializer, { ...props.value }),
  },
};

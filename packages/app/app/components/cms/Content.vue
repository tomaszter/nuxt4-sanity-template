<script setup lang="ts">
import type { TypedObject } from '@portabletext/types';
import { h } from 'vue';
import type { PortableTextVueComponents } from '@portabletext/vue';
import { NuxtLink } from '#components';
import { linkedRoute } from '../../../../../shared/cms';
import type { Reference } from '../../../../../shared/cms';
defineProps<{ blocks: TypedObject[] }>();
const { table, language } = useCms();
const urlFor = useSanityUrlFor();
const serializers: Partial<PortableTextVueComponents> = {
  marks: {
    internalLink: (props, { slots }) => {
      const target = linkedRoute(
        table.value,
        props.value?.page as Reference | undefined,
        language.value
      );
      return target
        ? h(NuxtLink, { to: target.path }, slots)
        : h('span', {}, slots);
    },
    link: (props, { slots }) => {
      const href = props.value?.href || '';
      return /^(https?:|mailto:|tel:)/i.test(href)
        ? h('a', { href, rel: 'noopener noreferrer' }, slots)
        : h('span', {}, slots);
    },
  },
  types: {
    contentImage: props =>
      !props.value?.asset?._ref
        ? null
        : h('figure', [
            h('img', {
              src: urlFor(props.value).width(1200).url(),
              alt: props.value.alt || '',
              loading: 'lazy',
              style: 'max-width:100%;height:auto',
              srcset: [480, 800, 1200]
                .map(w => `${urlFor(props.value).width(w).url()} ${w}w`)
                .join(', '),
              sizes: '(max-width: 1024px) 100vw, 1024px',
            }),
            props.value.caption ? h('figcaption', props.value.caption) : null,
          ]),
  },
};
</script>
<template>
  <div class="cms-content">
    <SanityContent :value="blocks" :components="serializers" />
  </div>
</template>
<style scoped>
.cms-content :deep(p),
.cms-content :deep(figure),
.cms-content :deep(ul),
.cms-content :deep(ol) {
  margin-block: 1.25rem;
}
.cms-content :deep(h2) {
  font-size: 1.75rem;
  margin-block: 2rem 1rem;
}
.cms-content :deep(h3) {
  font-size: 1.35rem;
  margin-block: 1.5rem 1rem;
}
.cms-content :deep(a) {
  text-decoration: underline;
}
.cms-content :deep(ul) {
  list-style: disc;
  padding-left: 1.5rem;
}
.cms-content :deep(ol) {
  list-style: decimal;
  padding-left: 1.5rem;
}
</style>

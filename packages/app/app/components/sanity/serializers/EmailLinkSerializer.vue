<template>
  <UIEmailLink
    :to="email"
    :subject="subject"
    :body="body"
    :tabindex="tabindex || 0">
    <slot>{{ email.replace('@', '(at)') }}</slot>
  </UIEmailLink>
</template>

<script setup lang="ts">
// import type {
//   OmitSerializersPrivateProps,
//   GetArticleContentMarkDefsProps,
// } from '~~/sanity/utils';

// NOTE: Conditional types is not supported by vue sfc compiler
// The code below won't work and cause compilation error
// type EmailLinkProps = OmitSerializersPrivateProps<
//   GetArticleContentMarkDefsProps<'emailLink'>
// >;

// So we manually declare each prop
type EmailLinkProps = {
  email: string;
  tabindex?: number | undefined;
  subject?: string | undefined;
  body?: string | undefined;
};

const { email, subject, body, tabindex } = defineProps<EmailLinkProps>();

defineSlots<{
  default: () => unknown;
}>();
</script>

<template>
  <div>
    <h2>Default layout</h2>
    <div ref="wrapper">
      <div ref="content">
        <AppHeader />
        <main>
          <slot></slot>
        </main>
        <AppFooter />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineSlots<{
  default: () => unknown;
}>();

const contentRef = useTemplateRef('content');
const wrapperRef = useTemplateRef('wrapper');

useMainScrollerSetup(contentRef, wrapperRef);
</script>

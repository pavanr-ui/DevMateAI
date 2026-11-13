<script setup>
/**
 * EmptyState - friendly placeholder when there is nothing to show yet.
 *
 * <EmptyState :icon="History" title="No conversations yet"
 *   description="Start a chat and it will appear here.">
 *   <AppButton to="/assistant">New chat</AppButton>
 * </EmptyState>
 */
defineProps({
  icon: { type: [Object, Function], default: null },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="flex flex-col items-center px-6 py-12 text-center">
    <div
      v-if="icon"
      class="mb-4 grid size-12 place-items-center rounded-2xl border border-line bg-surface text-primary shadow-card"
      aria-hidden="true"
    >
      <component :is="icon" :size="22" />
    </div>
    <h3 class="text-base font-semibold text-fg">{{ title }}</h3>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-muted">{{ description }}</p>
    <div v-if="$slots.default" class="mt-5 flex flex-wrap justify-center gap-2">
      <slot />
    </div>
  </div>
</template>

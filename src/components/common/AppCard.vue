<script setup>
/**
 * AppCard - rounded white surface with optional header.
 *
 * <AppCard title="Usage" description="Last 7 days">...</AppCard>
 * <AppCard padding="none">...custom content...</AppCard>
 */
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  padding: {
    type: String,
    default: 'md',
    validator: (v) => ['none', 'sm', 'md', 'lg'].includes(v),
  },
  as: { type: String, default: 'section' },
})

const paddings = { none: '', sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' }
</script>

<template>
  <component
    :is="as"
    :class="['rounded-2xl border border-line bg-surface shadow-card', paddings[padding]]"
  >
    <header v-if="title || $slots.actions" class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 v-if="title" class="text-base font-semibold text-fg">{{ title }}</h2>
        <p v-if="description" class="mt-0.5 text-sm text-muted">{{ description }}</p>
      </div>
      <slot name="actions" />
    </header>
    <slot />
  </component>
</template>

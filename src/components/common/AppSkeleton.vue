<script setup>
/**
 * AppSkeleton - grey placeholder shown while content loads.
 *
 * <AppSkeleton class="h-4 w-40" />
 * <AppSkeleton variant="circle" class="size-10" />
 * <AppSkeleton variant="text" :lines="3" />
 *
 * Hidden from screen readers; announce loading state on the parent instead
 * (e.g. aria-busy="true").
 */
defineProps({
  variant: {
    type: String,
    default: 'block',
    validator: (v) => ['block', 'circle', 'text'].includes(v),
  },
  lines: { type: Number, default: 3 },
})
</script>

<template>
  <div v-if="variant === 'text'" class="flex flex-col gap-2" aria-hidden="true">
    <div
      v-for="n in lines"
      :key="n"
      class="h-3 animate-pulse rounded bg-surface-muted"
      :class="n === lines && lines > 1 ? 'w-2/3' : 'w-full'"
    />
  </div>
  <div
    v-else
    aria-hidden="true"
    :class="[
      'animate-pulse bg-surface-muted',
      variant === 'circle' ? 'rounded-full' : 'rounded-lg',
    ]"
  />
</template>

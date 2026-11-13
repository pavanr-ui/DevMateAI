<script setup>
/**
 * AppButton - the one button used across the app.
 *
 * <AppButton>Save</AppButton>
 * <AppButton variant="secondary" size="sm" :loading="saving">Save</AppButton>
 * <AppButton to="/dashboard">Go</AppButton>   (renders a router link)
 *
 * Icons: pass a Lucide component, e.g. :icon="Sparkles"
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { LoaderCircle } from '@lucide/vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'danger'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  type: { type: String, default: 'button' },
  to: { type: [String, Object], default: null },
  icon: { type: [Object, Function], default: null },
  iconRight: { type: [Object, Function], default: null },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
})

const isDisabled = computed(() => props.disabled || props.loading)

const variants = {
  primary: 'bg-primary text-on-primary shadow-card hover:bg-primary-hover',
  secondary: 'border border-line bg-surface text-fg shadow-card hover:bg-surface-muted',
  ghost: 'text-muted hover:bg-surface-muted hover:text-fg',
  danger: 'bg-danger text-white shadow-card hover:opacity-90 dark:text-zinc-950',
}

const sizes = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-base',
}
const iconSize = { sm: 14, md: 16, lg: 18 }

const classes = computed(() => [
  'inline-flex shrink-0 select-none items-center justify-center font-medium transition-colors',
  'disabled:pointer-events-none disabled:opacity-50',
  variants[props.variant],
  sizes[props.size],
  props.block && 'w-full',
])
</script>

<template>
  <RouterLink v-if="to && !isDisabled" :to="to" :class="classes">
    <component :is="icon" v-if="icon" :size="iconSize[size]" aria-hidden="true" />
    <slot />
    <component :is="iconRight" v-if="iconRight" :size="iconSize[size]" aria-hidden="true" />
  </RouterLink>

  <button
    v-else
    :type="type"
    :class="classes"
    :disabled="isDisabled"
    :aria-busy="loading || undefined"
  >
    <LoaderCircle v-if="loading" :size="iconSize[size]" class="animate-spin" aria-hidden="true" />
    <component :is="icon" v-else-if="icon" :size="iconSize[size]" aria-hidden="true" />
    <slot />
    <component :is="iconRight" v-if="iconRight" :size="iconSize[size]" aria-hidden="true" />
  </button>
</template>

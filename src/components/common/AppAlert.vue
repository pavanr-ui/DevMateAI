<script setup>
/**
 * AppAlert - inline message box (form errors, success notes, info).
 *
 * <AppAlert variant="error">Email or password is incorrect.</AppAlert>
 *
 * Errors use role="alert" so screen readers announce them immediately;
 * other variants use role="status" (polite).
 */
import { computed } from 'vue'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from '@lucide/vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'info',
    validator: (v) => ['info', 'success', 'warning', 'error'].includes(v),
  },
  title: { type: String, default: '' },
})

const styles = {
  info: { box: 'bg-info-soft text-info', icon: Info },
  success: { box: 'bg-success-soft text-success', icon: CircleCheck },
  warning: { box: 'bg-warning-soft text-warning', icon: TriangleAlert },
  error: { box: 'bg-danger-soft text-danger', icon: CircleAlert },
}
const style = computed(() => styles[props.variant])
</script>

<template>
  <div
    :role="variant === 'error' ? 'alert' : 'status'"
    :class="['flex gap-3 rounded-xl px-4 py-3 text-sm', style.box]"
  >
    <component :is="style.icon" :size="18" class="mt-px shrink-0" aria-hidden="true" />
    <div class="text-fg">
      <p v-if="title" class="font-medium">{{ title }}</p>
      <slot />
    </div>
  </div>
</template>

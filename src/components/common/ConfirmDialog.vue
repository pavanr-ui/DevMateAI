<script setup>
/**
 * ConfirmDialog - "Are you sure?" for destructive actions.
 * <ConfirmDialog v-model:open="show" title="Delete project?" confirm-label="Delete"
 *   :loading="deleting" @confirm="remove">This can't be undone.</ConfirmDialog>
 */
import AppDialog from './AppDialog.vue'
import AppButton from './AppButton.vue'

const open = defineModel('open', { type: Boolean, default: false })
defineProps({
  title: { type: String, required: true },
  confirmLabel: { type: String, default: 'Confirm' },
  danger: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
})
defineEmits(['confirm'])
</script>

<template>
  <AppDialog v-model:open="open" :title="title" size="sm">
    <div class="text-sm text-muted"><slot /></div>
    <template #footer>
      <!-- Safe default: Enter/Space on open cancels instead of confirming -->
      <AppButton variant="secondary" :disabled="loading" autofocus @click="open = false">
        Cancel
      </AppButton>
      <AppButton
        :variant="danger ? 'danger' : 'primary'"
        :loading="loading"
        @click="$emit('confirm')"
      >
        {{ confirmLabel }}
      </AppButton>
    </template>
  </AppDialog>
</template>

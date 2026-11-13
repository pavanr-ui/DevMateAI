<script setup>
/**
 * AppDialog - modal built on the browser's native <dialog> element, which
 * gives us focus trapping, Esc-to-close and a backdrop for free (accessible
 * by default).
 *
 * <AppDialog v-model:open="show" title="New project">...<template #footer>...</template></AppDialog>
 */
import { ref, useId, watch, onMounted } from 'vue'
import { X } from '@lucide/vue'

const open = defineModel('open', { type: Boolean, default: false })
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md'].includes(v) },
})

const dialog = ref(null)
const titleId = useId()
const descriptionId = useId()

function sync(value) {
  const el = dialog.value
  if (!el) return
  if (value && !el.open) el.showModal()
  if (!value && el.open) el.close()
}
// flush: 'post' = open the dialog AFTER Vue renders its content, so the
// browser can move focus to the field marked `autofocus`.
watch(open, sync, { flush: 'post' })
onMounted(() => sync(open.value))

/** Clicking the dark backdrop (outside the panel) closes the dialog. */
function onBackdropClick(event) {
  if (event.target === dialog.value) open.value = false
}
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    :aria-describedby="description ? descriptionId : undefined"
    :class="[
      'm-auto w-[calc(100%-2rem)] rounded-2xl border border-line bg-surface p-0 text-fg shadow-raised',
      'backdrop:bg-zinc-950/40 backdrop:backdrop-blur-[2px]',
      size === 'sm' ? 'max-w-sm' : 'max-w-lg',
    ]"
    @close="open = false"
    @click="onBackdropClick"
  >
    <div class="p-5 sm:p-6">
      <header class="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 :id="titleId" class="text-lg font-semibold text-fg">{{ title }}</h2>
          <p v-if="description" :id="descriptionId" class="mt-1 text-sm text-muted">
            {{ description }}
          </p>
        </div>
        <button
          type="button"
          class="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-subtle hover:bg-surface-muted hover:text-fg"
          aria-label="Close"
          @click="open = false"
        >
          <X :size="18" aria-hidden="true" />
        </button>
      </header>

      <!-- Only render content while open, so forms reset each time -->
      <slot v-if="open" />

      <footer v-if="$slots.footer && open" class="mt-6 flex flex-wrap justify-end gap-2">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

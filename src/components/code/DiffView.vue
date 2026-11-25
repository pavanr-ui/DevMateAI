<script setup>
/**
 * DiffView - shows corrected code two ways:
 *  "Changes": red/green line diff against the original (unchanged runs collapsed)
 *  "Full code": the complete corrected code, highlighted, with a copy button
 */
import { computed, ref } from 'vue'
import { Check, Copy } from '@lucide/vue'
import CodeBlock from './CodeBlock.vue'
import { collapseUnchanged, diffLines, diffStats } from '@/utils/diff'
import { useClipboard } from '@/composables/useClipboard'

const props = defineProps({
  original: { type: String, required: true },
  updated: { type: String, required: true },
  lang: { type: String, default: '' },
})

const tab = ref('changes')
const { copy, copied } = useClipboard()

const lines = computed(() => diffLines(props.original, props.updated))
const rows = computed(() => (lines.value ? collapseUnchanged(lines.value) : []))
const stats = computed(() => (lines.value ? diffStats(lines.value) : null))
const unchanged = computed(() => stats.value && !stats.value.added && !stats.value.removed)

const rowClass = {
  add: 'bg-success-soft',
  del: 'bg-danger-soft',
  same: '',
}
const signClass = { add: 'text-success', del: 'text-danger', same: 'text-subtle' }
const sign = { add: '+', del: '−', same: ' ' }
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <div role="tablist" aria-label="Code view" class="flex rounded-lg bg-surface-muted p-0.5">
        <button
          v-for="t in [
            ['changes', 'Changes'],
            ['full', 'Full code'],
          ]"
          :key="t[0]"
          type="button"
          role="tab"
          :aria-selected="tab === t[0]"
          :class="[
            'rounded-md px-3 py-1 text-xs font-medium transition-colors',
            tab === t[0] ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
          ]"
          @click="tab = t[0]"
        >
          {{ t[1] }}
        </button>
      </div>
      <span v-if="stats && !unchanged" class="text-xs tabular-nums">
        <span class="text-success">+{{ stats.added }}</span>
        <span class="ml-1.5 text-danger">−{{ stats.removed }}</span>
        <span class="text-subtle"> lines</span>
      </span>
      <button
        type="button"
        class="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface-muted hover:text-fg"
        @click="copy(updated)"
      >
        <Check v-if="copied" :size="14" class="text-success" aria-hidden="true" />
        <Copy v-else :size="14" aria-hidden="true" />
        {{ copied ? 'Copied' : 'Copy corrected code' }}
      </button>
    </div>

    <div v-if="tab === 'changes'" role="tabpanel">
      <p v-if="!lines" class="rounded-xl bg-surface-muted p-4 text-sm text-muted">
        This code is too long to compare line by line. Use "Full code" instead.
      </p>
      <p v-else-if="unchanged" class="rounded-xl bg-surface-muted p-4 text-sm text-muted">
        No changes were needed.
      </p>
      <div
        v-else
        class="diff overflow-x-auto rounded-xl border border-line bg-surface text-xs leading-6"
      >
        <table class="w-full border-collapse">
          <caption class="sr-only">
            Line changes: plus marks added lines, minus marks removed lines.
          </caption>
          <tbody>
            <template v-for="(row, i) in rows" :key="i">
              <tr v-if="row.type === 'skip'" class="bg-surface-muted text-subtle">
                <td colspan="4" class="px-3 py-0.5 text-center">
                  ⋯ {{ row.count }} unchanged {{ row.count === 1 ? 'line' : 'lines' }}
                </td>
              </tr>
              <tr v-else :class="rowClass[row.type]">
                <td class="w-10 pr-2 pl-3 text-right text-subtle select-none">
                  {{ row.oldLine ?? '' }}
                </td>
                <td class="w-10 pr-2 text-right text-subtle select-none">
                  {{ row.newLine ?? '' }}
                </td>
                <td :class="['w-5 text-center select-none', signClass[row.type]]">
                  <span class="sr-only">{{
                    row.type === 'add' ? 'Added' : row.type === 'del' ? 'Removed' : ''
                  }}</span>
                  <span aria-hidden="true">{{ sign[row.type] }}</span>
                </td>
                <td class="pr-4 whitespace-pre text-fg">{{ row.text || ' ' }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else role="tabpanel">
      <CodeBlock :code="updated" :lang="lang" />
    </div>
  </div>
</template>

<style scoped>
.diff {
  font-family: var(--font-mono);
  font-variant-ligatures: none;
  tab-size: 2;
}
</style>

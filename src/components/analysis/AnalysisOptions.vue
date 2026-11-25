<script setup>
/**
 * Language / answer language / project pickers shared by the AI tools.
 */
import { useId } from 'vue'
import { CODE_LANGUAGES, RESPONSE_LANGUAGES } from '@/utils/codeLanguages'

const language = defineModel('language', { type: String, default: 'auto' })
const responseLanguage = defineModel('responseLanguage', { type: String, default: 'en' })
const projectId = defineModel('projectId', { type: String, default: null })

defineProps({
  projects: { type: Array, default: () => [] },
})

const id = useId()
const selectClass =
  'h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg shadow-card hover:border-line-strong'
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-3">
    <div class="flex flex-col gap-1.5">
      <label :for="`${id}-lang`" class="text-sm font-medium text-fg">Language</label>
      <select :id="`${id}-lang`" v-model="language" :class="selectClass">
        <option v-for="[value, label] in CODE_LANGUAGES" :key="value" :value="value">
          {{ label }}
        </option>
      </select>
    </div>
    <div class="flex flex-col gap-1.5">
      <label :for="`${id}-answer`" class="text-sm font-medium text-fg">Explain in</label>
      <select :id="`${id}-answer`" v-model="responseLanguage" :class="selectClass">
        <option v-for="[value, label] in RESPONSE_LANGUAGES" :key="value" :value="value">
          {{ label }}
        </option>
      </select>
    </div>
    <div class="flex flex-col gap-1.5">
      <label :for="`${id}-project`" class="text-sm font-medium text-fg">Project</label>
      <select :id="`${id}-project`" v-model="projectId" :class="selectClass">
        <option :value="null">None</option>
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>
  </div>
</template>

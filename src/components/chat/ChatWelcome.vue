<script setup>
/**
 * Empty-chat screen with clickable starter prompts.
 */
import { Bug, Code2, Lightbulb, Zap } from '@lucide/vue'
import AppLogo from '@/components/common/AppLogo.vue'

defineEmits(['pick'])

const suggestions = [
  {
    icon: Code2,
    label: 'Vue 3 data-fetching composable with loading and error states',
    mode: 'generate',
    language: 'vue',
    text: 'Create a Vue 3 composable that fetches data with loading and error states',
  },
  {
    icon: Lightbulb,
    label: 'Explain JavaScript closures with a simple example',
    mode: 'explain',
    language: 'javascript',
    text: 'Explain JavaScript closures with a simple example',
  },
  {
    icon: Zap,
    label: 'Optimize a for-loop that filters and maps an array',
    mode: 'optimize',
    language: 'javascript',
    text: 'Optimize this:\n\nconst result = []\nfor (let i = 0; i < items.length; i++) {\n  if (items[i].active) result.push(items[i].name.toUpperCase())\n}',
  },
  {
    icon: Bug,
    label: 'Why is `this` undefined inside setTimeout?',
    mode: 'chat',
    language: 'javascript',
    text: 'Why does `this` become undefined inside a setTimeout callback?',
  },
]
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col items-center px-4 py-10 text-center">
    <AppLogo :show-text="false" size="lg" />
    <h2 class="mt-4 text-xl font-semibold tracking-tight text-fg">
      How can I help you code today?
    </h2>
    <p class="mt-1.5 text-sm text-muted">
      Generate, explain or optimize code. Pick a starter or type your own question.
    </p>

    <ul class="mt-8 grid w-full gap-2 text-left sm:grid-cols-2">
      <li v-for="s in suggestions" :key="s.text">
        <button
          type="button"
          class="flex h-full w-full items-start gap-3 rounded-xl text-left border border-line bg-surface p-3.5 text-sm text-fg shadow-card transition hover:border-line-strong hover:shadow-raised"
          @click="$emit('pick', s)"
        >
          <component
            :is="s.icon"
            :size="16"
            class="mt-0.5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span class="line-clamp-2">{{ s.label }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

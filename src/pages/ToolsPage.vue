<script setup>
/**
 * All AI tools in one grid. Mainly for phones, where the bottom tab bar
 * only has room for five items.
 */
import { RouterLink } from 'vue-router'
import { ArrowRight } from '@lucide/vue'
import PageContainer from '@/components/common/PageContainer.vue'
import { tools } from '@/router/navigation'
</script>

<template>
  <PageContainer title="AI Tools" description="Pick a tool to get started.">
    <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="tool in tools" :key="tool.name">
        <RouterLink
          :to="{ name: tool.name }"
          class="group flex h-full items-start gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:border-line-strong hover:shadow-raised"
        >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"
            aria-hidden="true"
          >
            <component :is="tool.icon" :size="20" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-2 font-medium text-fg">
              {{ tool.label }}
              <ArrowRight
                :size="14"
                class="text-subtle transition group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </span>
            <span class="mt-1 block text-sm text-muted">{{ tool.description }}</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </PageContainer>
</template>

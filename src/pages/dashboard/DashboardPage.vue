<script setup>
/**
 * Dashboard placeholder for Phase 2: welcome + quick actions.
 * Phase 3 adds recent activity, usage statistics and recent projects.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Sparkles } from '@lucide/vue'
import PageContainer from '@/components/common/PageContainer.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import { tools } from '@/router/navigation'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})
</script>

<template>
  <PageContainer>
    <section class="mb-8">
      <p class="text-sm font-medium text-primary">{{ greeting }}</p>
      <h2 class="mt-1 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
        Welcome, {{ auth.firstName }} 👋
      </h2>
      <p class="mt-2 text-sm text-muted">What would you like to build today?</p>
    </section>

    <section aria-labelledby="quick-actions" class="mb-8">
      <h3 id="quick-actions" class="mb-3 text-sm font-semibold text-fg">Quick actions</h3>
      <ul class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <li v-for="tool in tools" :key="tool.name">
          <RouterLink
            :to="{ name: tool.name }"
            class="flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:border-line-strong hover:shadow-raised"
          >
            <span
              class="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary"
              aria-hidden="true"
            >
              <component :is="tool.icon" :size="18" />
            </span>
            <span class="text-sm font-medium text-fg">{{ tool.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <!-- Preview of Phase 3 content, shown as loading skeletons -->
    <div class="grid gap-4 lg:grid-cols-3">
      <AppCard title="Recent activity" class="lg:col-span-2" aria-busy="true">
        <div class="flex flex-col gap-4">
          <div v-for="n in 3" :key="n" class="flex items-center gap-3">
            <AppSkeleton variant="circle" class="size-9" />
            <div class="flex-1"><AppSkeleton variant="text" :lines="2" /></div>
          </div>
        </div>
      </AppCard>
      <AppCard title="AI usage" description="Coming in Phase 3">
        <div class="flex flex-col items-center gap-3 py-6 text-center">
          <Sparkles :size="28" class="text-primary" aria-hidden="true" />
          <p class="text-sm text-muted">Your usage statistics will appear here.</p>
        </div>
      </AppCard>
    </div>
  </PageContainer>
</template>

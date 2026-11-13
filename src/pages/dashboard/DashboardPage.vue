<script setup>
/**
 * Dashboard: welcome, quick actions, usage stats, usage chart, tool
 * breakdown, recent activity and recent projects.
 * Each section has its own loading / empty / error state.
 */
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { onIonViewWillEnter } from '@ionic/vue'
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  ChartColumn,
  Coins,
  FolderKanban,
  MessageSquareCode,
  Plus,
  Zap,
} from '@lucide/vue'
import PageContainer from '@/components/common/PageContainer.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import StatTile from '@/components/dashboard/StatTile.vue'
import UsageChart from '@/components/dashboard/UsageChart.vue'
import ModuleBreakdown from '@/components/dashboard/ModuleBreakdown.vue'
import ActivityList from '@/components/dashboard/ActivityList.vue'
import ProjectCard from '@/components/dashboard/ProjectCard.vue'
import ProjectFormDialog from '@/components/dashboard/ProjectFormDialog.vue'
import { tools } from '@/router/navigation'
import { useAuthStore } from '@/stores/auth'
import { CHART_DAYS, useDashboardStore } from '@/stores/dashboard'
import { useProjectsStore } from '@/stores/projects'
import { formatCompact } from '@/utils/usage'

const auth = useAuthStore()
const dashboard = useDashboardStore()
const projects = useProjectsStore()

const projectFormOpen = ref(false)

// Ionic keeps pages alive in its navigation stack, so refresh every time the
// dashboard becomes visible (not only on first mount).
onIonViewWillEnter(() => {
  dashboard.load()
  projects.load()
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const usageLoading = computed(() => ['idle', 'loading'].includes(dashboard.usageStatus))
const projectsLoading = computed(() => ['idle', 'loading'].includes(projects.status))
const s = computed(() => dashboard.stats)
</script>

<template>
  <PageContainer>
    <!-- Welcome -->
    <section class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-primary">{{ greeting }}</p>
        <h2 class="mt-1 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          Welcome back, {{ auth.firstName }}
        </h2>
        <p class="mt-1.5 text-sm text-muted">Here's what's happening with your work.</p>
      </div>
      <div class="flex gap-2">
        <AppButton variant="secondary" :icon="Plus" @click="projectFormOpen = true">
          New project
        </AppButton>
        <AppButton :icon="MessageSquareCode" :to="{ name: 'assistant' }">Ask AI</AppButton>
      </div>
    </section>

    <!-- Quick actions -->
    <section aria-labelledby="quick-actions" class="mb-6">
      <h3 id="quick-actions" class="sr-only">Quick actions</h3>
      <ul class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <li v-for="tool in tools" :key="tool.name">
          <RouterLink
            :to="{ name: tool.name }"
            class="flex h-full items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-card transition hover:border-line-strong hover:shadow-raised"
          >
            <span
              class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"
              aria-hidden="true"
            >
              <component :is="tool.icon" :size="16" />
            </span>
            <span class="text-sm leading-tight font-medium text-fg">{{ tool.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <!-- Stats -->
    <section aria-label="AI usage statistics" class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label="Requests today"
        :icon="Zap"
        :value="s.requestsToday"
        hint="Resets at 00:00 UTC"
        :loading="usageLoading"
      />
      <StatTile
        label="Requests this week"
        :icon="Activity"
        :value="s.requestsWeek"
        :change="dashboard.hasUsage ? s.requestsTrend : undefined"
        hint="Last 7 days"
        :loading="usageLoading"
      />
      <StatTile
        label="Tokens this week"
        :icon="Coins"
        :value="formatCompact(s.tokensWeek)"
        :change="dashboard.hasUsage ? s.tokensTrend : undefined"
        hint="Input + output"
        :loading="usageLoading"
      />
      <StatTile
        label="Active days"
        :icon="CalendarCheck"
        :value="`${s.activeDays} / 7`"
        hint="Days you used AI this week"
        :loading="usageLoading"
      />
    </section>

    <!-- Usage overview -->
    <div class="mb-6 grid gap-4 lg:grid-cols-3">
      <AppCard
        title="Daily AI requests"
        :description="`Last ${CHART_DAYS} days`"
        class="lg:col-span-2"
      >
        <AppSkeleton v-if="usageLoading" class="h-56" />
        <ErrorState
          v-else-if="dashboard.usageStatus === 'error'"
          message="We couldn't load your usage."
          @retry="dashboard.loadUsage()"
        />
        <EmptyState
          v-else-if="!dashboard.hasUsage"
          :icon="ChartColumn"
          title="No AI usage yet"
          description="Ask the AI Assistant something and your daily usage will show up here."
        />
        <UsageChart v-else :series="dashboard.series" />
      </AppCard>

      <AppCard title="By tool" :description="`Requests, last ${CHART_DAYS} days`">
        <AppSkeleton v-if="usageLoading" variant="text" :lines="5" />
        <ErrorState
          v-else-if="dashboard.usageStatus === 'error'"
          :retryable="false"
          message="Usage is unavailable right now."
        />
        <p v-else-if="!dashboard.modules.length" class="py-8 text-center text-sm text-muted">
          Your most-used tools will appear here.
        </p>
        <ModuleBreakdown v-else :items="dashboard.modules" />
      </AppCard>
    </div>

    <!-- Activity + projects -->
    <div class="grid gap-4 lg:grid-cols-3">
      <AppCard title="Recent activity" class="lg:col-span-2">
        <div v-if="['idle', 'loading'].includes(dashboard.activityStatus)" aria-busy="true">
          <div v-for="n in 3" :key="n" class="flex items-center gap-3 py-3">
            <AppSkeleton variant="circle" class="size-9" />
            <div class="flex-1"><AppSkeleton variant="text" :lines="2" /></div>
          </div>
        </div>
        <ErrorState
          v-else-if="dashboard.activityStatus === 'error'"
          message="We couldn't load your recent activity."
          @retry="dashboard.loadActivity()"
        />
        <EmptyState
          v-else-if="!dashboard.activity.length"
          :icon="Activity"
          title="Nothing here yet"
          description="Your AI chats, reviews and fixes will be listed here."
        />
        <ActivityList v-else :items="dashboard.activity" />
      </AppCard>

      <AppCard title="Recent projects">
        <template #actions>
          <RouterLink
            v-if="projects.items.length"
            :to="{ name: 'projects' }"
            class="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all <ArrowRight :size="14" aria-hidden="true" />
          </RouterLink>
        </template>

        <div v-if="projectsLoading" class="flex flex-col gap-2" aria-busy="true">
          <AppSkeleton v-for="n in 3" :key="n" class="h-16 rounded-xl" />
        </div>
        <ErrorState
          v-else-if="projects.status === 'error'"
          message="We couldn't load your projects."
          @retry="projects.load({ force: true })"
        />
        <EmptyState
          v-else-if="!projects.items.length"
          :icon="FolderKanban"
          title="No projects yet"
          description="Group your work and give the AI context."
        >
          <AppButton size="sm" :icon="Plus" @click="projectFormOpen = true">New project</AppButton>
        </EmptyState>
        <ul v-else class="flex flex-col gap-2">
          <li v-for="project in projects.recent" :key="project.id">
            <ProjectCard :project="project" compact />
          </li>
        </ul>
      </AppCard>
    </div>

    <ProjectFormDialog v-model:open="projectFormOpen" />
  </PageContainer>
</template>

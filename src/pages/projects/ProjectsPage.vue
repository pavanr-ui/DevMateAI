<script setup>
import { onMounted, ref } from 'vue'
import { FolderKanban, Plus } from '@lucide/vue'
import PageContainer from '@/components/common/PageContainer.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ProjectCard from '@/components/dashboard/ProjectCard.vue'
import ProjectFormDialog from '@/components/dashboard/ProjectFormDialog.vue'
import { useProjectsStore } from '@/stores/projects'

const projects = useProjectsStore()
onMounted(() => projects.load())

const formOpen = ref(false)
const editing = ref(null)
const confirmOpen = ref(false)
const deleting = ref(null)
const deleteBusy = ref(false)

function openCreate() {
  editing.value = null
  formOpen.value = true
}
function openEdit(project) {
  editing.value = project
  formOpen.value = true
}
function askDelete(project) {
  deleting.value = project
  confirmOpen.value = true
}
async function confirmDelete() {
  deleteBusy.value = true
  try {
    await projects.remove(deleting.value.id)
    confirmOpen.value = false
  } finally {
    deleteBusy.value = false
  }
}
</script>

<template>
  <PageContainer
    title="Projects"
    description="Workspaces that give the AI context about what you build."
  >
    <template #actions>
      <AppButton :icon="Plus" @click="openCreate">New project</AppButton>
    </template>

    <!-- Loading -->
    <div
      v-if="projects.status === 'loading' || projects.status === 'idle'"
      class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
    >
      <AppSkeleton v-for="n in 3" :key="n" class="h-36 rounded-xl" />
    </div>

    <!-- Error -->
    <AppCard v-else-if="projects.status === 'error'" padding="none">
      <ErrorState
        message="We couldn't load your projects."
        @retry="projects.load({ force: true })"
      />
    </AppCard>

    <!-- Empty -->
    <AppCard v-else-if="!projects.items.length" padding="none">
      <EmptyState
        :icon="FolderKanban"
        title="No projects yet"
        description="Create a project for something you're building, like a portfolio site or a Vue app. Later, chats and reviews can use it as context."
      >
        <AppButton :icon="Plus" @click="openCreate">Create your first project</AppButton>
      </EmptyState>
    </AppCard>

    <!-- List -->
    <ul v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="project in projects.items" :key="project.id">
        <ProjectCard :project="project" actions @edit="openEdit" @delete="askDelete" />
      </li>
    </ul>

    <ProjectFormDialog v-model:open="formOpen" :project="editing" />
    <ConfirmDialog
      v-model:open="confirmOpen"
      title="Delete project?"
      confirm-label="Delete project"
      :loading="deleteBusy"
      @confirm="confirmDelete"
    >
      <strong class="text-fg">{{ deleting?.name }}</strong> will be permanently deleted. This can't
      be undone.
    </ConfirmDialog>
  </PageContainer>
</template>

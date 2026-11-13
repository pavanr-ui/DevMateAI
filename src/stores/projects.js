import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as projectsService from '@/services/firebase/projects'
import { useAuthStore } from './auth'

/**
 * Projects store. `status` drives the UI: 'idle' | 'loading' | 'ready' | 'error'.
 */
export const useProjectsStore = defineStore('projects', () => {
  const items = ref([])
  const status = ref('idle')

  const recent = computed(() => items.value.slice(0, 4))
  const uid = () => useAuthStore().user?.uid

  async function load({ force = false } = {}) {
    if (!uid() || (status.value === 'ready' && !force)) return
    status.value = 'loading'
    try {
      items.value = await projectsService.listProjects(uid())
      status.value = 'ready'
    } catch {
      status.value = 'error'
    }
  }

  async function create(input) {
    await projectsService.createProject(uid(), input)
    await load({ force: true }) // re-read so server timestamps are real values
  }

  async function update(id, input) {
    await projectsService.updateProject(uid(), id, input)
    await load({ force: true })
  }

  async function remove(id) {
    await projectsService.deleteProject(uid(), id)
    items.value = items.value.filter((p) => p.id !== id)
  }

  function reset() {
    items.value = []
    status.value = 'idle'
  }

  return { items, status, recent, load, create, update, remove, reset }
})

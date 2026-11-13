<script setup>
/**
 * Create / edit a project. Pass `project` to edit; omit it to create.
 */
import { computed, reactive, ref, watch } from 'vue'
import AppDialog from '@/components/common/AppDialog.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppTextarea from '@/components/common/AppTextarea.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { useProjectsStore } from '@/stores/projects'
import { PROJECT_LIMITS, parseTechStack, validateProject } from '@/utils/projectValidation'

const open = defineModel('open', { type: Boolean, default: false })
const props = defineProps({
  project: { type: Object, default: null },
})
const emit = defineEmits(['saved'])

const projects = useProjectsStore()
const isEdit = computed(() => Boolean(props.project))

const form = reactive({ name: '', description: '', techStackText: '' })
const errors = reactive({ name: '', description: '', techStack: '' })
const formError = ref('')
const saving = ref(false)
const tags = computed(() => parseTechStack(form.techStackText))

// Fill (or clear) the form every time the dialog opens
watch(open, (isOpen) => {
  if (!isOpen) return
  form.name = props.project?.name ?? ''
  form.description = props.project?.description ?? ''
  form.techStackText = (props.project?.techStack ?? []).join(', ')
  Object.assign(errors, { name: '', description: '', techStack: '' })
  formError.value = ''
})

async function save() {
  const input = { name: form.name, description: form.description, techStack: tags.value }
  const result = validateProject(input)
  Object.assign(errors, result.errors)
  if (!result.valid) return

  saving.value = true
  formError.value = ''
  try {
    if (isEdit.value) await projects.update(props.project.id, input)
    else await projects.create(input)
    open.value = false
    emit('saved')
  } catch {
    formError.value = "Couldn't save the project. Please try again."
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppDialog
    v-model:open="open"
    :title="isEdit ? 'Edit project' : 'New project'"
    description="Projects give the AI context about what you're building."
  >
    <form id="project-form" class="flex flex-col gap-4" novalidate @submit.prevent="save">
      <AppAlert v-if="formError" variant="error">{{ formError }}</AppAlert>
      <AppInput
        v-model="form.name"
        label="Project name"
        placeholder="Portfolio website"
        :error="errors.name"
        required
        autofocus
      />
      <AppTextarea
        v-model="form.description"
        label="Description"
        placeholder="What is it, and who is it for?"
        :maxlength="PROJECT_LIMITS.description"
        :error="errors.description"
      />
      <div>
        <AppInput
          v-model="form.techStackText"
          label="Tech stack"
          placeholder="Vue 3, Tailwind CSS, Firebase"
          hint="Separate technologies with commas."
          :error="errors.techStack"
        />
        <ul v-if="tags.length" class="mt-2 flex flex-wrap gap-1.5" aria-label="Technologies">
          <li
            v-for="tag in tags"
            :key="tag"
            class="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary"
          >
            {{ tag }}
          </li>
        </ul>
      </div>
    </form>

    <template #footer>
      <AppButton variant="secondary" @click="open = false">Cancel</AppButton>
      <AppButton type="submit" form="project-form" :loading="saving">
        {{ isEdit ? 'Save changes' : 'Create project' }}
      </AppButton>
    </template>
  </AppDialog>
</template>

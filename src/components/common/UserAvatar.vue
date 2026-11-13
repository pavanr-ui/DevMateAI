<script setup>
/**
 * UserAvatar - profile photo, or initials when there is no photo.
 */
import { computed, ref } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
})

const failed = ref(false)

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase()
})

const sizes = { sm: 'size-8 text-xs', md: 'size-9 text-sm', lg: 'size-14 text-lg' }
</script>

<template>
  <img
    v-if="photoUrl && !failed"
    :src="photoUrl"
    :alt="name ? `${name}'s avatar` : 'User avatar'"
    :class="['shrink-0 rounded-full object-cover', sizes[size]]"
    referrerpolicy="no-referrer"
    @error="failed = true"
  />
  <span
    v-else
    :class="[
      'grid shrink-0 place-items-center rounded-full bg-primary-soft font-semibold text-primary',
      sizes[size],
    ]"
    aria-hidden="true"
  >
    {{ initials }}
  </span>
</template>

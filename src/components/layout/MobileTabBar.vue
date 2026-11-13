<script setup>
/**
 * Bottom tab bar for phones and tablets (hidden at lg = 1024px+).
 * Large touch targets (56px tall) and safe-area padding for the iPhone
 * home indicator.
 */
import { RouterLink, useRoute } from 'vue-router'
import { mobileTabs } from '@/router/navigation'

const route = useRoute()
const isActive = (tab) => route.name === tab.name || tab.activeFor?.includes(route.name)
</script>

<template>
  <nav
    class="shrink-0 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    aria-label="Primary"
  >
    <ul class="mx-auto flex max-w-lg">
      <li v-for="tab in mobileTabs" :key="tab.name" class="flex-1">
        <RouterLink
          :to="{ name: tab.name }"
          :aria-current="isActive(tab) ? 'page' : undefined"
          :class="[
            'flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
            isActive(tab) ? 'text-primary' : 'text-subtle hover:text-fg',
          ]"
        >
          <component
            :is="tab.icon"
            :size="20"
            :stroke-width="isActive(tab) ? 2.25 : 2"
            aria-hidden="true"
          />
          {{ tab.label }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

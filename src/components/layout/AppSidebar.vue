<script setup>
/**
 * Desktop sidebar (shown at lg = 1024px and wider).
 * Collapses to an icon-only rail; the choice is remembered.
 */
import { RouterLink, useRoute } from 'vue-router'
import { LogOut, PanelLeftClose, PanelLeftOpen } from '@lucide/vue'
import AppLogo from '@/components/common/AppLogo.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { sidebarSections, settingsItem } from '@/router/navigation'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const ui = useUiStore()
const auth = useAuthStore()
const route = useRoute()
const isActive = (item) => route.name === item.name

const linkBase =
  'group flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors'
const linkIdle = 'text-muted hover:bg-surface-muted hover:text-fg'
const linkActive = 'bg-primary-soft text-primary'
</script>

<template>
  <aside
    :class="[
      'hidden shrink-0 flex-col border-r border-line bg-sidebar transition-[width] duration-200 lg:flex',
      ui.sidebarCollapsed ? 'w-[4.25rem]' : 'w-64',
    ]"
    aria-label="Main"
  >
    <!-- Logo + collapse -->
    <div
      :class="[
        'flex h-16 items-center border-b border-line px-3',
        ui.sidebarCollapsed ? 'justify-center' : 'justify-between',
      ]"
    >
      <RouterLink :to="{ name: 'dashboard' }" class="rounded-lg">
        <AppLogo :show-text="!ui.sidebarCollapsed" size="sm" />
      </RouterLink>
      <button
        v-if="!ui.sidebarCollapsed"
        type="button"
        class="grid size-8 place-items-center rounded-lg text-subtle hover:bg-surface-muted hover:text-fg"
        aria-label="Collapse sidebar"
        title="Collapse sidebar"
        @click="ui.toggleSidebar()"
      >
        <PanelLeftClose :size="18" aria-hidden="true" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
      <button
        v-if="ui.sidebarCollapsed"
        type="button"
        class="mb-3 grid h-9 w-full place-items-center rounded-lg text-subtle hover:bg-surface-muted hover:text-fg"
        aria-label="Expand sidebar"
        title="Expand sidebar"
        @click="ui.toggleSidebar()"
      >
        <PanelLeftOpen :size="18" aria-hidden="true" />
      </button>

      <div v-for="(section, i) in sidebarSections" :key="i" class="mb-5 last:mb-0">
        <p
          v-if="section.label && !ui.sidebarCollapsed"
          class="mb-1.5 px-2.5 text-xs font-medium tracking-wide text-subtle uppercase"
        >
          {{ section.label }}
        </p>
        <div v-else-if="section.label" class="mx-2 mb-3 border-t border-line" />

        <ul class="flex flex-col gap-0.5">
          <li v-for="item in section.items" :key="item.name">
            <RouterLink
              :to="{ name: item.name }"
              :class="[
                linkBase,
                isActive(item) ? linkActive : linkIdle,
                ui.sidebarCollapsed && 'justify-center px-0',
              ]"
              :title="ui.sidebarCollapsed ? item.label : undefined"
            >
              <component :is="item.icon" :size="18" class="shrink-0" aria-hidden="true" />
              <span :class="ui.sidebarCollapsed ? 'sr-only' : 'truncate'">{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Settings + user -->
    <div class="border-t border-line p-3">
      <RouterLink
        :to="{ name: settingsItem.name }"
        :class="[
          linkBase,
          isActive(settingsItem) ? linkActive : linkIdle,
          ui.sidebarCollapsed && 'justify-center px-0',
        ]"
        :title="ui.sidebarCollapsed ? settingsItem.label : undefined"
      >
        <component :is="settingsItem.icon" :size="18" class="shrink-0" aria-hidden="true" />
        <span :class="ui.sidebarCollapsed ? 'sr-only' : ''">{{ settingsItem.label }}</span>
      </RouterLink>

      <div
        :class="[
          'mt-2 flex items-center gap-2.5 rounded-xl p-1.5',
          ui.sidebarCollapsed && 'flex-col',
        ]"
      >
        <UserAvatar :name="auth.displayName" :photo-url="auth.user?.photoURL" size="sm" />
        <div v-if="!ui.sidebarCollapsed" class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-fg">{{ auth.displayName }}</p>
          <p class="truncate text-xs text-subtle">{{ auth.user?.email }}</p>
        </div>
        <button
          type="button"
          class="grid size-8 shrink-0 place-items-center rounded-lg text-subtle hover:bg-surface-muted hover:text-danger"
          aria-label="Sign out"
          title="Sign out"
          @click="auth.logout()"
        >
          <LogOut :size="16" aria-hidden="true" />
        </button>
      </div>
    </div>
  </aside>
</template>

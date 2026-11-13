<script setup>
/**
 * Placeholder for modules that aren't built yet. Reads the module's label,
 * icon, description and planned phase from the route (see navigation.js).
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Construction, LayoutDashboard } from '@lucide/vue'
import PageContainer from '@/components/common/PageContainer.vue'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const route = useRoute()
const item = computed(() => route.meta.nav ?? {})
</script>

<template>
  <PageContainer :title="item.label" :description="item.description">
    <AppCard padding="none">
      <EmptyState
        :icon="item.icon ?? Construction"
        :title="`${item.label} is coming soon`"
        :description="`This module is planned for Phase ${item.phase}. The navigation and layout are ready for it.`"
      >
        <AppButton variant="secondary" :icon="LayoutDashboard" :to="{ name: 'dashboard' }">
          Back to dashboard
        </AppButton>
      </EmptyState>
    </AppCard>
  </PageContainer>
</template>

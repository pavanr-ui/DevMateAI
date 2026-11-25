<script setup>
import InlineCode from '@/components/common/InlineCode.vue'
/**
 * PointList - a titled list of short points (strengths, steps, tips).
 */
defineProps({
  title: { type: String, required: true },
  items: { type: Array, required: true },
  icon: { type: [Object, Function], default: null },
  ordered: { type: Boolean, default: false },
  tone: { type: String, default: 'text-primary' },
})
</script>

<template>
  <section v-if="items.length">
    <h4 class="mb-2 flex items-center gap-2 text-sm font-semibold text-fg">
      <component :is="icon" v-if="icon" :size="16" :class="tone" aria-hidden="true" />
      {{ title }}
    </h4>
    <component
      :is="ordered ? 'ol' : 'ul'"
      :class="[
        'flex flex-col gap-1.5 pl-5 text-sm text-muted',
        ordered ? 'list-decimal' : 'list-disc',
      ]"
    >
      <li v-for="(item, i) in items" :key="i" class="marker:text-subtle">
        <InlineCode v-if="typeof item === 'string'" :text="item" />
        <template v-else>
          <span v-if="item.line" class="font-mono text-xs text-subtle">Line {{ item.line }}: </span>
          <InlineCode :text="item.description" />
        </template>
      </li>
    </component>
  </section>
</template>

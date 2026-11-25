import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TopicCatalog from '@/components/learn/TopicCatalog.vue'
import { ACTIVITIES, LEVELS, TOPICS } from '@/utils/learnTopics'

describe('learning path data', () => {
  it('every topic fits the 80-character limit the server enforces', () => {
    const all = LEVELS.flatMap((l) => TOPICS[l.id])
    expect(all.every((t) => t.length <= 80)).toBe(true)
    expect(new Set(all).size).toBe(all.length) // no duplicates across levels
  })

  it('activities use modes the server accepts', () => {
    const serverModes = ['chat', 'explain', 'examples', 'exercise', 'interview']
    expect(ACTIVITIES.every((a) => serverModes.includes(a.mode))).toBe(true)
  })
})

describe('TopicCatalog', () => {
  const mountCatalog = (props = {}) =>
    mount(TopicCatalog, { props: { level: 'beginner', explored: new Set(), ...props } })

  it('lists the topics for the chosen level', () => {
    const names = mountCatalog()
      .findAll('ul[aria-label=Topics] button')
      .map((b) => b.text())
    expect(names).toEqual(TOPICS.beginner)
  })

  it('searches across all levels', async () => {
    const wrapper = mountCatalog()
    await wrapper.get('input[type=search]').setValue('promise')
    const names = wrapper.findAll('ul[aria-label=Topics] button').map((b) => b.text())
    expect(names).toEqual(['Promises'])
  })

  it('shows progress and marks explored topics', () => {
    const wrapper = mountCatalog({ explored: new Set(['Loops', 'Functions']) })
    const bar = wrapper.get('[role=progressbar]')
    expect(bar.attributes('aria-label')).toBe(`2 of ${TOPICS.beginner.length} topics explored`)
    expect(wrapper.findAll('[aria-label=Explored]')).toHaveLength(2)
  })

  it('emits the topic with its level when picked', async () => {
    const wrapper = mountCatalog()
    await wrapper.findAll('ul[aria-label=Topics] button')[1].trigger('click')
    expect(wrapper.emitted('select')[0][0]).toEqual({ name: TOPICS.beginner[1], level: 'beginner' })
  })
})

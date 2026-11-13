import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatTile from '@/components/dashboard/StatTile.vue'

describe('StatTile', () => {
  it('shows the label and value', () => {
    const wrapper = mount(StatTile, { props: { label: 'Requests today', value: 12 } })
    expect(wrapper.text()).toContain('Requests today')
    expect(wrapper.text()).toContain('12')
  })

  it('shows change as text (not color only)', () => {
    const up = mount(StatTile, { props: { label: 'x', value: 1, change: 25 } })
    expect(up.text()).toContain('+25%')
    expect(up.text()).toContain('vs last week')

    const down = mount(StatTile, { props: { label: 'x', value: 1, change: -10 } })
    expect(down.text()).toContain('-10%')
  })

  it('says "New" when there is no previous period to compare with', () => {
    const wrapper = mount(StatTile, { props: { label: 'x', value: 1, change: null } })
    expect(wrapper.text()).toContain('New')
  })

  it('shows skeletons while loading', () => {
    const wrapper = mount(StatTile, { props: { label: 'x', value: 99, loading: true } })
    expect(wrapper.text()).not.toContain('99')
  })
})

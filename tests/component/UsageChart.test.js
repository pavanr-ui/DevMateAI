import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UsageChart from '@/components/dashboard/UsageChart.vue'
import { formatDayKey } from '@/utils/dates'

// Dates follow the machine's locale ("Nov 11" or "11 Nov"), so build expectations the same way.
const day = (key) => formatDayKey(key)

const series = [
  { key: '2026-11-11', requests: 2, tokens: 300 },
  { key: '2026-11-12', requests: 0, tokens: 0 },
  { key: '2026-11-13', requests: 7, tokens: 1200 },
]

describe('UsageChart', () => {
  it('gives every column an accessible label', () => {
    const wrapper = mount(UsageChart, { props: { series } })
    const labels = wrapper.findAll('li[tabindex="0"]').map((li) => li.attributes('aria-label'))
    expect(labels).toEqual([
      `${day('2026-11-11')}: 2 requests`,
      `${day('2026-11-12')}: 0 requests`,
      `${day('2026-11-13')}: 7 requests`,
    ])
  })

  it('shows a tooltip on keyboard focus', async () => {
    const wrapper = mount(UsageChart, { props: { series } })
    await wrapper.findAll('li[tabindex="0"]')[2].trigger('focus')
    const tooltip = wrapper.get('[role="status"]')
    expect(tooltip.text()).toContain('7 requests')
    expect(tooltip.text()).toContain('1,200 tokens')
  })

  it('can switch to a data table', async () => {
    const wrapper = mount(UsageChart, { props: { series } })
    await wrapper.get('button[aria-pressed]').trigger('click')
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
    expect(rows[0].text()).toContain(day('2026-11-13')) // newest first
  })

  it('rounds the axis to a clean number', () => {
    const wrapper = mount(UsageChart, {
      props: { series: [{ key: '2026-11-13', requests: 37, tokens: 0 }] },
    })
    expect(wrapper.text()).toContain('40') // 37 rounds up to 40 (midline 20)
    expect(wrapper.text()).toContain('20')
  })
})

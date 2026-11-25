import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScoreBadge from '@/components/analysis/ScoreBadge.vue'
import IssueList from '@/components/analysis/IssueList.vue'

describe('ScoreBadge', () => {
  it.each([
    [95, 'Excellent'],
    [75, 'Good'],
    [55, 'Needs work'],
    [20, 'Serious problems'],
  ])('labels %i as "%s" in text, not color only', (score, label) => {
    const wrapper = mount(ScoreBadge, { props: { score } })
    expect(wrapper.attributes('aria-label')).toBe(`Score ${score} out of 100: ${label}`)
    expect(wrapper.text()).toContain(label)
  })
})

describe('IssueList', () => {
  const issues = [
    {
      severity: 'critical',
      category: 'security',
      title: 'XSS',
      line: 4,
      description: 'd',
      suggestion: 's',
    },
    {
      severity: 'low',
      category: 'style',
      title: 'Naming',
      line: null,
      description: 'd',
      suggestion: '',
    },
    {
      severity: 'low',
      category: 'quality',
      title: 'Duplication',
      line: 9,
      description: 'd',
      suggestion: 's',
    },
  ]

  it('shows filter chips only for severities that occur', () => {
    const chips = mount(IssueList, { props: { issues } })
      .findAll('[role=radio]')
      .map((c) => c.text())
    expect(chips).toEqual(['All 3', 'Critical 1', 'Low 2'])
  })

  it('filters by severity', async () => {
    const wrapper = mount(IssueList, { props: { issues } })
    await wrapper.findAll('[role=radio]')[2].trigger('click')
    const titles = wrapper.findAll('h4').map((h) => h.text())
    expect(titles).toEqual(['Naming', 'Duplication'])
  })

  it('shows line numbers when known', () => {
    expect(mount(IssueList, { props: { issues } }).text()).toContain('Line 4')
  })
})

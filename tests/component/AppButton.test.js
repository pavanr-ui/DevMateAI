import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '@/components/common/AppButton.vue'

describe('AppButton', () => {
  it('renders a type="button" by default (never submits forms by accident)', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Save' } })
    expect(wrapper.get('button').attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('Save')
  })

  it('emits clicks', async () => {
    const wrapper = mount(AppButton, { slots: { default: 'Go' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('is disabled and marked busy while loading', () => {
    const wrapper = mount(AppButton, { props: { loading: true }, slots: { default: 'Save' } })
    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-busy')).toBe('true')
  })

  it('applies the chosen variant', () => {
    const wrapper = mount(AppButton, { props: { variant: 'danger' } })
    expect(wrapper.get('button').classes()).toContain('bg-danger')
  })
})

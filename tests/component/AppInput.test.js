import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '@/components/common/AppInput.vue'

describe('AppInput', () => {
  it('links the label to the input', () => {
    const wrapper = mount(AppInput, { props: { label: 'Email' } })
    const input = wrapper.get('input')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
  })

  it('supports v-model', async () => {
    const wrapper = mount(AppInput, {
      props: {
        label: 'Name',
        modelValue: '',
        'onUpdate:modelValue': (value) => wrapper.setProps({ modelValue: value }),
      },
    })
    await wrapper.get('input').setValue('Ada')
    expect(wrapper.props('modelValue')).toBe('Ada')
  })

  it('announces errors to screen readers', () => {
    const wrapper = mount(AppInput, { props: { label: 'Email', error: 'Email is required.' } })
    const input = wrapper.get('input')
    const errorId = input.attributes('aria-describedby')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.get(`#${errorId}`).text()).toBe('Email is required.')
  })

  it('can reveal and hide a password', async () => {
    const wrapper = mount(AppInput, { props: { label: 'Password', type: 'password' } })
    const toggle = wrapper.get('button[aria-label="Show password"]')
    expect(wrapper.get('input').attributes('type')).toBe('password')

    await toggle.trigger('click')
    expect(wrapper.get('input').attributes('type')).toBe('text')
    expect(wrapper.get('button').attributes('aria-label')).toBe('Hide password')
  })
})

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RequestForm from '@/components/RequestForm.vue'

describe('RequestForm', () => {
  it('renders the URL input and submit button', () => {
    const wrapper = mount(RequestForm, { props: { method: 'GET', url: '' } })
    expect(wrapper.find('input[name="requestUrl"]').exists()).toBe(true)
    expect(wrapper.find('button[name="submitRequestForm"]').exists()).toBe(true)
  })

  it('displays the initial method and url', async () => {
    const wrapper = mount(RequestForm, { props: { method: 'POST', url: 'https://example.com' } })
    await nextTick()

    expect(wrapper.find('input[name="requestUrl"]').element.value).toBe('https://example.com')
    expect(wrapper.text()).toContain('POST')
  })

  it('emits update:url when the URL input changes', async () => {
    const wrapper = mount(RequestForm, { props: { method: 'GET', url: '' } })
    const input = wrapper.find('input[name="requestUrl"]')

    await input.setValue('https://api.example.com')

    expect(wrapper.emitted('update:url')?.[0]).toEqual(['https://api.example.com'])
  })

  it('emits update:method when method is changed', async () => {
    const wrapper = mount(RequestForm, { props: { method: 'GET', url: '' } })
    const selectComponent = wrapper.findComponent({ name: 'Select' })

    await selectComponent.vm.$emit('update:modelValue', 'DELETE')
    await nextTick()

    expect(wrapper.emitted('update:method')?.[0]).toEqual(['DELETE'])
  })

  it('emits submit with current method and url on form submit', async () => {
    const wrapper = mount(RequestForm, {
      props: { method: 'GET', url: 'https://example.com' },
    })

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]).toEqual([{ method: 'GET', url: 'https://example.com' }])
  })

  it('emits submit with updated props when they change before submit', async () => {
    const wrapper = mount(RequestForm, { props: { method: 'GET', url: 'https://old.com' } })

    await wrapper.setProps({ method: 'PUT', url: 'https://new.com' })
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]).toEqual([{ method: 'PUT', url: 'https://new.com' }])
  })
})

import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MethodSelect from '@/components/MethodSelect.vue'

describe('MethodSelect', () => {
  it('emits update:modelValue when user changes to POST method', async () => {
    const wrapper = mount(MethodSelect, { props: { modelValue: 'GET' } })
    await nextTick()

    // Verify initial text is GET
    expect(wrapper.text()).toContain('GET')

    // Get the Select component and simulate the update:model-value event
    const selectComponent = wrapper.findComponent({ name: 'Select' })
    await selectComponent.vm.$emit('update:modelValue', 'POST')
    await nextTick()

    // Check that the emitted value is POST
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['POST'])
  })

  it('displays POST when modelValue prop is changed to POST', async () => {
    const wrapper = mount(MethodSelect, { props: { modelValue: 'GET' } })
    await nextTick()

    // Verify initial text is GET
    expect(wrapper.text()).toContain('GET')

    // Update the modelValue prop to POST
    await wrapper.setProps({ modelValue: 'POST' })

    // Assert that the component select text changed to POST
    expect(wrapper.text()).toContain('POST')
    expect(wrapper.text()).not.toContain('GET')
  })
})

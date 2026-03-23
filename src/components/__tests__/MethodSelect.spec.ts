import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MethodSelect from '@/components/MethodSelect.vue'

describe('MethodSelect', () => {
  it('renders with given method', async () => {
    const wrapper = mount(MethodSelect, { props: { modelValue: 'GET' } })
    await nextTick()
    expect(wrapper.text()).toContain('GET')
  })
})

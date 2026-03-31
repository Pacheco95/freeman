import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import HttpStatusIndicator from '@/components/HttpStatusIndicator.vue'
import { nextTick } from 'vue'

describe('HttpStatusIndicator', () => {
  it('should render the correct status code and message', async () => {
    const wrapper = mount(HttpStatusIndicator, { props: { status: 100 } })
    expect(wrapper.text()).toBe('100 Continue')

    await wrapper.setProps({ status: 200 })
    await nextTick()
    expect(wrapper.text()).toBe('200 OK')

    await wrapper.setProps({ status: 404 })
    await nextTick()
    expect(wrapper.text()).toBe('404 Not Found')

    await wrapper.setProps({ status: 500 })
    await nextTick()
    expect(wrapper.text()).toBe('500 Internal Server Error')

    await wrapper.setProps({ status: 999 })
    await nextTick()
    expect(wrapper.text()).toBe('999 Unknown Status')
  })
})

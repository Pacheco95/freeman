import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RequestTabBar from '@/components/RequestTabBar.vue'
import type { TabState } from '@/types/misc.ts'

const stubs = {
  Tabs: { template: '<div><slot /></div>' },
  TabsList: { template: '<div><slot /></div>' },
  TabsTrigger: { template: '<div><slot /></div>', props: ['value'] },
}

function makeTab(id: number, label: string): TabState {
  return {
    id,
    label,
    panelTab: 'params',
    method: 'GET',
    url: '',
    body: '',
    bodyType: 'none',
    bodyRawSyntax: 'JSON',
    bodyFormRows: [],
    params: [],
    headers: [],
  }
}

function mountTabBar(tabs: TabState[], activeTabId = tabs[0]!.id) {
  return mount(RequestTabBar, {
    props: { tabs, activeTabId },
    global: { stubs },
  })
}

describe('RequestTabBar', () => {
  describe('rendering', () => {
    it('renders a label span for each tab', () => {
      const wrapper = mountTabBar([makeTab(1, 'Request 1'), makeTab(2, 'My API')])
      const spans = wrapper.findAll('span')
      expect(spans.map((s) => s.text())).toEqual(['Request 1', 'My API'])
    })

    it('shows close buttons only when more than one tab exists', async () => {
      const wrapper = mountTabBar([makeTab(1, 'Request 1')])
      expect(wrapper.findAll('button')).toHaveLength(0)

      await wrapper.setProps({ tabs: [makeTab(1, 'Request 1'), makeTab(2, 'Request 2')] })
      expect(wrapper.findAll('button')).toHaveLength(2)
    })

    it('emits closeTab with the correct id when the close button is clicked', async () => {
      const wrapper = mountTabBar([makeTab(1, 'Request 1'), makeTab(2, 'Request 2')])
      const buttons = wrapper.findAll('button')

      await buttons[1]!.trigger('click')

      expect(wrapper.emitted('closeTab')).toEqual([[2]])
    })
  })

  describe('inline rename on double-click', () => {
    it('replaces the label span with an input when double-clicked', async () => {
      const wrapper = mountTabBar([makeTab(1, 'Request 1')])
      const span = wrapper.find('span')

      await span.trigger('dblclick')

      expect(wrapper.find('input').exists()).toBe(true)
      expect(wrapper.find('span').exists()).toBe(false)
    })

    it('pre-fills the input with the current label', async () => {
      const wrapper = mountTabBar([makeTab(1, 'My Tab')])
      await wrapper.find('span').trigger('dblclick')

      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('My Tab')
    })

    it('emits renameTab with the new label when Enter is pressed', async () => {
      const wrapper = mountTabBar([makeTab(1, 'Request 1')])
      await wrapper.find('span').trigger('dblclick')

      const input = wrapper.find('input')
      await input.setValue('Renamed')
      await input.trigger('keydown.enter')

      expect(wrapper.emitted('renameTab')).toEqual([[1, 'Renamed']])
    })

    it('trims whitespace before emitting', async () => {
      const wrapper = mountTabBar([makeTab(1, 'Request 1')])
      await wrapper.find('span').trigger('dblclick')

      const input = wrapper.find('input')
      await input.setValue('  Trimmed  ')
      await input.trigger('keydown.enter')

      expect(wrapper.emitted('renameTab')).toEqual([[1, 'Trimmed']])
    })

    it('does not emit renameTab when Enter is pressed with an empty value', async () => {
      const wrapper = mountTabBar([makeTab(1, 'Request 1')])
      await wrapper.find('span').trigger('dblclick')

      const input = wrapper.find('input')
      await input.setValue('   ')
      await input.trigger('keydown.enter')

      expect(wrapper.emitted('renameTab')).toBeUndefined()
    })

    it('emits renameTab and hides the input on blur', async () => {
      const wrapper = mountTabBar([makeTab(1, 'Request 1')])
      await wrapper.find('span').trigger('dblclick')

      const input = wrapper.find('input')
      await input.setValue('From Blur')
      await input.trigger('blur')
      await nextTick()

      expect(wrapper.emitted('renameTab')).toEqual([[1, 'From Blur']])
      expect(wrapper.find('input').exists()).toBe(false)
      expect(wrapper.find('span').exists()).toBe(true)
    })

    it('cancels rename without emitting when Escape is pressed', async () => {
      const wrapper = mountTabBar([makeTab(1, 'Request 1')])
      await wrapper.find('span').trigger('dblclick')

      const input = wrapper.find('input')
      await input.setValue('Changed')
      await input.trigger('keydown.esc')
      await nextTick()

      expect(wrapper.emitted('renameTab')).toBeUndefined()
      expect(wrapper.find('input').exists()).toBe(false)
    })

    it('restores the original label display after cancelling', async () => {
      const wrapper = mountTabBar([makeTab(1, 'Request 1')])
      await wrapper.find('span').trigger('dblclick')

      await wrapper.find('input').trigger('keydown.esc')
      await nextTick()

      expect(wrapper.find('span').text()).toBe('Request 1')
    })

    it('only edits the double-clicked tab when multiple tabs are open', async () => {
      const wrapper = mountTabBar([makeTab(1, 'First'), makeTab(2, 'Second')], 1)
      const spans = wrapper.findAll('span')

      await spans[1]!.trigger('dblclick')

      const inputs = wrapper.findAll('input')
      expect(inputs).toHaveLength(1)
      expect((inputs[0]!.element as HTMLInputElement).value).toBe('Second')
      expect(wrapper.findAll('span')).toHaveLength(1)
      expect(wrapper.findAll('span')[0]!.text()).toBe('First')
    })

    it('hides the input after a successful rename', async () => {
      const wrapper = mountTabBar([makeTab(1, 'Request 1')])
      await wrapper.find('span').trigger('dblclick')

      const input = wrapper.find('input')
      await input.setValue('Done')
      await input.trigger('keydown.enter')
      await nextTick()

      expect(wrapper.find('input').exists()).toBe(false)
    })
  })
})

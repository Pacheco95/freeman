import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useRequestStore } from '@/stores/request.store.ts'

const flushStoreWatchers = async () => {
  await nextTick()
  await nextTick()
}

describe('request store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await flushStoreWatchers()
  })

  it('initializes params with one inactive empty param', async () => {
    const store = useRequestStore()
    await flushStoreWatchers()

    expect(store.activeTab.url).toBe('')
    expect(store.activeTab.params).toEqual([{ active: false, data: { key: '', value: '' } }])
  })

  it('updates params when url query changes', async () => {
    const store = useRequestStore()

    store.activeTab.url = 'https://example.com/users?foo=bar&foo=baz&x=1'
    await flushStoreWatchers()

    expect(store.activeTab.params).toEqual([
      { active: true, data: { key: 'foo', value: 'bar' } },
      { active: true, data: { key: 'foo', value: 'baz' } },
      { active: true, data: { key: 'x', value: '1' } },
      { active: false, data: { key: '', value: '' } },
    ])
  })

  it('updates url query when params change and only includes active rows', async () => {
    const store = useRequestStore()

    store.activeTab.url = 'https://example.com/api?old=1'
    await flushStoreWatchers()

    store.activeTab.params = [
      { active: true, data: { key: 'a', value: '1' } },
      { active: false, data: { key: 'ignored', value: '2' } },
      { active: true, data: { key: 'a', value: '3' } },
      { active: false, data: { key: '', value: '' } },
    ]
    await flushStoreWatchers()

    expect(store.activeTab.url).toBe('https://example.com/api?a=1&a=3')
  })

  it('preserves relative path and hash when params update url', async () => {
    const store = useRequestStore()

    store.activeTab.url = '/search/results?old=1#section'
    await flushStoreWatchers()

    store.activeTab.params = [
      { active: true, data: { key: 'q', value: 'vue' } },
      { active: false, data: { key: '', value: '' } },
    ]
    await flushStoreWatchers()

    expect(store.activeTab.url).toBe('/search/results?q=vue#section')
  })

  describe('tab management', () => {
    it('initializes with one tab', () => {
      const store = useRequestStore()
      expect(store.tabs).toHaveLength(1)
      expect(store.tabs[0]!.id).toBe(1)
      expect(store.activeTabId).toBe(1)
    })

    it('addTab creates a new tab and makes it active', async () => {
      const store = useRequestStore()
      store.addTab()
      await flushStoreWatchers()

      expect(store.tabs).toHaveLength(2)
      expect(store.activeTabId).toBe(2)
      expect(store.activeTab.url).toBe('')
    })

    it('tabs have independent state', async () => {
      const store = useRequestStore()

      store.activeTab.url = 'https://example.com'
      await flushStoreWatchers()

      store.addTab()
      await flushStoreWatchers()

      expect(store.activeTab.url).toBe('')

      store.activeTabId = 1
      expect(store.activeTab.url).toBe('https://example.com')
    })

    it('closeTab removes the tab and activates the previous one', async () => {
      const store = useRequestStore()
      store.addTab()
      await flushStoreWatchers()

      store.closeTab(2)
      await flushStoreWatchers()

      expect(store.tabs).toHaveLength(1)
      expect(store.activeTabId).toBe(1)
    })

    it('closeTab does nothing when only one tab exists', () => {
      const store = useRequestStore()
      store.closeTab(1)

      expect(store.tabs).toHaveLength(1)
    })

    it('setRequest applies only to the active tab', async () => {
      const store = useRequestStore()
      store.addTab()
      await flushStoreWatchers()

      store.setRequest({ method: 'POST', url: 'https://api.example.com', body: '{}' })
      await flushStoreWatchers()

      expect(store.activeTab.method).toBe('POST')
      expect(store.activeTab.url).toBe('https://api.example.com')

      store.activeTabId = 1
      expect(store.activeTab.method).toBe('GET')
      expect(store.activeTab.url).toBe('')
    })

    it('URL-params sync works on newly added tabs', async () => {
      const store = useRequestStore()
      store.addTab()
      await flushStoreWatchers()

      store.activeTab.url = 'https://example.com?q=test'
      await flushStoreWatchers()

      expect(store.activeTab.params).toEqual([
        { active: true, data: { key: 'q', value: 'test' } },
        { active: false, data: { key: '', value: '' } },
      ])
    })
  })
})

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
    const store = useRequestStore()
    store.createWorkspace('Test Workspace')
    store.addTab()
    await flushStoreWatchers()
  })

  it('initializes params as empty when url is empty', async () => {
    const store = useRequestStore()
    await flushStoreWatchers()

    expect(store.activeTab!.url).toBe('')
    expect(store.activeTab!.params).toEqual([])
  })

  it('updates params when url query changes', async () => {
    const store = useRequestStore()

    store.activeTab!.url = 'https://example.com/users?foo=bar&foo=baz&x=1'
    await flushStoreWatchers()

    expect(store.activeTab!.params).toEqual([
      { active: true, data: { key: 'foo', value: 'bar' } },
      { active: true, data: { key: 'foo', value: 'baz' } },
      { active: true, data: { key: 'x', value: '1' } },
    ])
  })

  it('updates url query when params change and only includes active rows', async () => {
    const store = useRequestStore()

    store.activeTab!.url = 'https://example.com/api?old=1'
    await flushStoreWatchers()

    store.activeTab!.params = [
      { active: true, data: { key: 'a', value: '1' } },
      { active: false, data: { key: 'ignored', value: '2' } },
      { active: true, data: { key: 'a', value: '3' } },
      { active: false, data: { key: '', value: '' } },
    ]
    await flushStoreWatchers()

    expect(store.activeTab!.url).toBe('https://example.com/api?a=1&a=3')
  })

  it('preserves relative path and hash when params update url', async () => {
    const store = useRequestStore()

    store.activeTab!.url = '/search/results?old=1#section'
    await flushStoreWatchers()

    store.activeTab!.params = [
      { active: true, data: { key: 'q', value: 'vue' } },
      { active: false, data: { key: '', value: '' } },
    ]
    await flushStoreWatchers()

    expect(store.activeTab!.url).toBe('/search/results?q=vue#section')
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
      expect(store.activeTab!.url).toBe('')
    })

    it('tabs have independent state', async () => {
      const store = useRequestStore()

      store.activeTab!.url = 'https://example.com'
      await flushStoreWatchers()

      store.addTab()
      await flushStoreWatchers()

      expect(store.activeTab!.url).toBe('')

      store.activeTabId = 1
      expect(store.activeTab!.url).toBe('https://example.com')
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

    it('closeTab closes the last tab leaving no open tabs', () => {
      const store = useRequestStore()
      store.closeTab(1)

      expect(store.tabs).toHaveLength(0)
    })

    describe('renameTab', () => {
      it('updates the label of the specified tab', () => {
        const store = useRequestStore()
        store.renameTab(1, 'My API')
        expect(store.tabs[0]!.label).toBe('My API')
      })

      it('does not change the tab id', () => {
        const store = useRequestStore()
        store.renameTab(1, 'New Name')
        expect(store.tabs[0]!.id).toBe(1)
      })

      it('does not affect other tabs', async () => {
        const store = useRequestStore()
        store.addTab()
        await flushStoreWatchers()

        store.renameTab(1, 'Renamed')

        expect(store.tabs[0]!.label).toBe('Renamed')
        expect(store.tabs[1]!.label).toBe('Request 2')
      })

      it('allows duplicate names across tabs', async () => {
        const store = useRequestStore()
        store.addTab()
        await flushStoreWatchers()

        store.renameTab(1, 'Same Name')
        store.renameTab(2, 'Same Name')

        expect(store.tabs[0]!.label).toBe('Same Name')
        expect(store.tabs[1]!.label).toBe('Same Name')
      })

      it('is a no-op for a non-existent tab id', () => {
        const store = useRequestStore()
        store.renameTab(999, 'Ghost')
        expect(store.tabs[0]!.label).toBe('Request 1')
      })
    })

    describe('setRequest (cURL import)', () => {
      it('sets method, url, headers, and raw body type for a JSON POST', async () => {
        const store = useRequestStore()

        store.setRequest({
          method: 'POST',
          url: 'https://api.example.com/posts',
          headers: [{ key: 'Content-Type', value: 'application/json' }],
          body: { title: 'foo', userId: 1 },
        })
        await flushStoreWatchers()

        expect(store.activeTab!.method).toBe('POST')
        expect(store.activeTab!.url).toBe('https://api.example.com/posts')
        expect(store.activeTab!.headers).toEqual([
          { active: true, data: { key: 'Content-Type', value: 'application/json' } },
          { active: false, data: { key: '', value: '' } },
        ])
        expect(store.activeTab!.bodyType).toBe('raw')
        expect(store.activeTab!.bodyRawSyntax).toBe('JSON')
        expect(store.activeTab!.body).toBe(JSON.stringify({ title: 'foo', userId: 1 }, null, 2))
      })

      it('sets bodyType to none when body is absent', async () => {
        const store = useRequestStore()

        store.setRequest({ method: 'GET', url: 'https://api.example.com/posts' })
        await flushStoreWatchers()

        expect(store.activeTab!.bodyType).toBe('none')
        expect(store.activeTab!.body).toBe('')
      })

      it('populates query params from url and strips them from the url field', async () => {
        const store = useRequestStore()

        store.setRequest({
          method: 'POST',
          url: 'https://api.example.com/search',
          params: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '20' },
          ],
          body: { query: 'test' },
        })
        await flushStoreWatchers()

        expect(store.activeTab!.params).toEqual([
          { active: true, data: { key: 'page', value: '1' } },
          { active: true, data: { key: 'limit', value: '20' } },
          { active: false, data: { key: '', value: '' } },
        ])
      })

      it('populates multiple headers', async () => {
        const store = useRequestStore()

        store.setRequest({
          method: 'PUT',
          url: 'https://api.example.com/posts/1',
          headers: [
            { key: 'Content-Type', value: 'application/json' },
            { key: 'Authorization', value: 'Bearer token123' },
          ],
          body: { title: 'updated' },
        })
        await flushStoreWatchers()

        expect(store.activeTab!.headers).toEqual([
          { active: true, data: { key: 'Content-Type', value: 'application/json' } },
          { active: true, data: { key: 'Authorization', value: 'Bearer token123' } },
          { active: false, data: { key: '', value: '' } },
        ])
      })

      it('handles a string body and sets raw body type', async () => {
        const store = useRequestStore()

        store.setRequest({
          method: 'POST',
          url: 'https://api.example.com/raw',
          body: '{"raw":true}',
        })
        await flushStoreWatchers()

        expect(store.activeTab!.bodyType).toBe('raw')
        expect(store.activeTab!.bodyRawSyntax).toBe('JSON')
        expect(store.activeTab!.body).toBe('{"raw":true}')
      })

      it('overwrites previous body state when importing into an existing tab', async () => {
        const store = useRequestStore()

        store.setRequest({
          method: 'POST',
          url: 'https://api.example.com/first',
          body: { step: 1 },
        })
        await flushStoreWatchers()

        store.setRequest({ method: 'GET', url: 'https://api.example.com/second' })
        await flushStoreWatchers()

        expect(store.activeTab!.bodyType).toBe('none')
        expect(store.activeTab!.body).toBe('')
      })
    })

    it('setRequest applies only to the active tab', async () => {
      const store = useRequestStore()
      store.addTab()
      await flushStoreWatchers()

      store.setRequest({ method: 'POST', url: 'https://api.example.com', body: '{}' })
      await flushStoreWatchers()

      expect(store.activeTab!.method).toBe('POST')
      expect(store.activeTab!.url).toBe('https://api.example.com')

      store.activeTabId = 1
      expect(store.activeTab!.method).toBe('GET')
      expect(store.activeTab!.url).toBe('')
    })

    describe('$reset', () => {
      it('resets to no workspaces', async () => {
        const store = useRequestStore()
        store.addTab()
        store.addTab()
        await flushStoreWatchers()

        store.$reset()

        expect(store.workspaces).toHaveLength(0)
        expect(store.tabs).toHaveLength(0)
      })

      it('resets activeWorkspaceId to 0 and activeTab to null', async () => {
        const store = useRequestStore()
        store.$reset()

        expect(store.activeWorkspaceId).toBe(0)
        expect(store.activeTab).toBeNull()
      })

      it('resets nextWorkspaceId so the first new workspace gets id 1', async () => {
        const store = useRequestStore()
        store.$reset()

        store.createWorkspace('Fresh')
        await flushStoreWatchers()

        expect(store.workspaces[0]!.id).toBe(1)
      })

      it('returns to the same state as a freshly initialised store', async () => {
        const store = useRequestStore()
        store.addTab()
        store.activeTab!.url = 'https://example.com'
        store.setRequest({ method: 'DELETE', url: 'https://api.example.com' })
        await flushStoreWatchers()

        store.$reset()
        await flushStoreWatchers()

        setActivePinia(createPinia())
        const fresh = useRequestStore()
        expect(store.workspaces).toHaveLength(fresh.workspaces.length)
        expect(store.activeWorkspaceId).toBe(fresh.activeWorkspaceId)
        expect(store.activeTab).toBe(fresh.activeTab)
      })

      it('re-registers URL-params sync after reset and workspace creation', async () => {
        const store = useRequestStore()
        store.$reset()

        store.createWorkspace('New')
        store.addTab()
        await flushStoreWatchers()

        store.activeTab!.url = 'https://example.com?q=test'
        await flushStoreWatchers()

        expect(store.activeTab!.params).toEqual([
          { active: true, data: { key: 'q', value: 'test' } },
        ])
      })
    })

    it('URL-params sync works on newly added tabs', async () => {
      const store = useRequestStore()
      store.addTab()
      await flushStoreWatchers()

      store.activeTab!.url = 'https://example.com?q=test'
      await flushStoreWatchers()

      expect(store.activeTab!.params).toEqual([{ active: true, data: { key: 'q', value: 'test' } }])
    })
  })
})

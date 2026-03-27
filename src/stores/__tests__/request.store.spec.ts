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

    expect(store.url).toBe('')
    expect(store.params).toEqual([{ active: false, data: { key: '', value: '' } }])
  })

  it('updates params when url query changes', async () => {
    const store = useRequestStore()

    store.url = 'https://example.com/users?foo=bar&foo=baz&x=1'
    await flushStoreWatchers()

    expect(store.params).toEqual([
      { active: true, data: { key: 'foo', value: 'bar' } },
      { active: true, data: { key: 'foo', value: 'baz' } },
      { active: true, data: { key: 'x', value: '1' } },
      { active: false, data: { key: '', value: '' } },
    ])
  })

  it('updates url query when params change and only includes active rows', async () => {
    const store = useRequestStore()

    store.url = 'https://example.com/api?old=1'
    await flushStoreWatchers()

    store.params = [
      { active: true, data: { key: 'a', value: '1' } },
      { active: false, data: { key: 'ignored', value: '2' } },
      { active: true, data: { key: 'a', value: '3' } },
      { active: false, data: { key: '', value: '' } },
    ]
    await flushStoreWatchers()

    expect(store.url).toBe('https://example.com/api?a=1&a=3')
  })

  it('preserves relative path and hash when params update url', async () => {
    const store = useRequestStore()

    store.url = '/search/results?old=1#section'
    await flushStoreWatchers()

    store.params = [
      { active: true, data: { key: 'q', value: 'vue' } },
      { active: false, data: { key: '', value: '' } },
    ]
    await flushStoreWatchers()

    expect(store.url).toBe('/search/results?q=vue#section')
  })
})

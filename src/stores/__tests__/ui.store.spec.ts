import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUIStore } from '@/stores/ui.store.ts'

describe('ui store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('has importModalOpen set to false', () => {
      const store = useUIStore()
      expect(store.importModalOpen).toBe(false)
    })
  })

  describe('openImportModal', () => {
    it('sets importModalOpen to true', () => {
      const store = useUIStore()
      store.openImportModal()
      expect(store.importModalOpen).toBe(true)
    })
  })

  describe('closeImportModal', () => {
    it('sets importModalOpen to false', () => {
      const store = useUIStore()
      store.openImportModal()
      store.closeImportModal()
      expect(store.importModalOpen).toBe(false)
    })
  })

  describe('$reset', () => {
    it('resets importModalOpen to false', () => {
      const store = useUIStore()
      store.openImportModal()

      store.$reset()

      expect(store.importModalOpen).toBe(false)
    })

    it('returns to the default initial state', () => {
      const store = useUIStore()
      const fresh = useUIStore()

      store.openImportModal()
      store.$reset()

      expect(store.$state).toEqual(fresh.$state)
    })
  })
})

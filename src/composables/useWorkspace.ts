import { useRequestStore } from '@/stores/request.store.ts'
import { loadWorkspace, saveWorkspace } from '@/services/workspace.service.ts'

export function useWorkspace() {
  const store = useRequestStore()

  async function save() {
    // JSON round-trip strips Vue reactive proxies before passing to the service
    const plainTabs = JSON.parse(JSON.stringify(store.tabs))
    await saveWorkspace(plainTabs, store.activeTabId).catch(console.error)
  }

  async function load() {
    const data = await loadWorkspace()
    if (!data) return

    store.$patch({
      tabs: data.tabs,
      activeTabId: data.activeTabId,
      nextTabId: data.nextTabId,
    })
    store._initWatchers()
  }

  return { save, load }
}

import { useRequestStore } from '@/stores/request.store.ts'
import { loadWorkspace, saveWorkspace } from '@/services/workspace.service.ts'

export function useWorkspace() {
  const store = useRequestStore()

  async function save() {
    const ws = store.activeWorkspace
    if (!ws) return
    // JSON round-trip strips Vue reactive proxies before passing to the service
    const plainRequests = JSON.parse(JSON.stringify(ws.requests))
    await saveWorkspace(plainRequests, ws.openRequestIds, ws.activeRequestId, ws.name).catch(
      console.error,
    )
  }

  async function load() {
    const data = await loadWorkspace()
    if (!data) return

    const ws = store.activeWorkspace
    if (!ws) return
    ws.requests = data.requests
    ws.openRequestIds = data.openRequestIds
    ws.activeRequestId = data.activeRequestId
    ws.nextRequestId = data.nextRequestId
    if (data.name) ws.name = data.name
    store._initWatchers()
  }

  return { save, load }
}

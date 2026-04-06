import { ask } from '@tauri-apps/plugin-dialog'
import { useRequestStore } from '@/stores/request.store.ts'
import { loadWorkspace, saveWorkspace } from '@/services/workspace.service.ts'

export function useWorkspace() {
  const store = useRequestStore()

  async function save() {
    const ws = store.activeWorkspace
    if (!ws) return
    // JSON round-trip strips Vue reactive proxies before passing to the service
    const plainRequests = JSON.parse(JSON.stringify(ws.requests))
    const plainVariables = JSON.parse(JSON.stringify(ws.variables))
    await saveWorkspace(
      plainRequests,
      ws.openRequestIds,
      ws.activeRequestId,
      ws.name,
      plainVariables,
    ).catch(console.error)
  }

  async function load() {
    const data = await loadWorkspace()
    if (!data) return

    const duplicate = store.workspaces.find((w) => w.name === data.name)
    if (duplicate) {
      const confirmed = await ask(
        `A workspace named "${data.name}" already exists. Import it as a separate workspace anyway?`,
        { title: 'Workspace already exists', kind: 'warning' },
      )
      if (!confirmed) return
    }

    store.createWorkspace(data.name)
    const ws = store.activeWorkspace
    if (!ws) return
    ws.requests = data.requests
    ws.openRequestIds = data.openRequestIds
    ws.activeRequestId = data.activeRequestId
    ws.nextRequestId = data.nextRequestId
    ws.variables = data.variables
    store._initWatchers()
  }

  return { save, load }
}

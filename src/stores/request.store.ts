import { computed, nextTick, ref } from 'vue'
import type { Ref, WatchStopHandle } from 'vue'
import { defineStore } from 'pinia'
import type { Method, Request } from '@/types/Request.ts'
import type { TabState, Workspace } from '@/types/misc.ts'
import {
  mergeActiveParamsIntoUrl,
  parseSearchToParamRows,
  useUrlParamsSync,
} from '@/composables/useUrlParamsSync.ts'

function createRequest(id: number): TabState {
  return {
    id,
    label: 'Untitled request',
    panelTab: 'params',
    method: 'GET' as Method,
    url: '',
    body: '',
    bodyType: 'none',
    bodyRawSyntax: 'JSON',
    bodyFormRows: [],
    params: [],
    headers: [],
  }
}

function createWorkspace(id: number, name: string): Workspace {
  return {
    id,
    name,
    requests: [],
    openRequestIds: [],
    activeRequestId: 0,
    nextRequestId: 1,
  }
}

function labelFromUrl(url: string): string {
  if (!url) return 'Untitled request'
  try {
    const u = new URL(url)
    return u.origin + u.pathname
  } catch {
    // relative URL — strip query string and fragment
    return url.split('?')[0]!.split('#')[0]!
  }
}

export const useRequestStore = defineStore(
  'request',
  () => {
    const workspaces = ref<Workspace[]>([])
    const activeWorkspaceId = ref<number>(0)
    const nextWorkspaceId = ref<number>(1)

    const activeWorkspace = computed(
      () => workspaces.value.find((w) => w.id === activeWorkspaceId.value) ?? null,
    )

    // tabs = requests that are currently open as tabs (backward-compatible)
    const tabs = computed(() => {
      const ws = activeWorkspace.value
      if (!ws) return []
      return ws.requests.filter((r) => ws.openRequestIds.includes(r.id))
    })

    const activeTabId = computed({
      get: () => activeWorkspace.value?.activeRequestId ?? 0,
      set: (v: number) => {
        if (activeWorkspace.value) activeWorkspace.value.activeRequestId = v
      },
    })

    const activeTab = computed(
      () => activeWorkspace.value?.requests.find((r) => r.id === activeTabId.value) ?? null,
    )

    // Watcher management — keyed by request ID, scoped to the active workspace
    const syncingMap = new Map<number, Ref<boolean>>()
    const stopHandlesMap = new Map<number, WatchStopHandle[]>()

    function registerWatchers(id: number) {
      if (stopHandlesMap.has(id)) return
      const syncingRef = ref(false)
      syncingMap.set(id, syncingRef)

      const urlRef = computed({
        get: () => tabs.value.find((t) => t.id === id)!.url,
        set: (v) => {
          const r = tabs.value.find((t) => t.id === id)
          if (r) r.url = v
        },
      })
      const paramsRef = computed({
        get: () => tabs.value.find((t) => t.id === id)!.params,
        set: (v) => {
          const r = tabs.value.find((t) => t.id === id)
          if (r) r.params = v
        },
      })

      stopHandlesMap.set(id, useUrlParamsSync(urlRef, paramsRef, syncingRef))
    }

    function unregisterWatchers(id: number) {
      stopHandlesMap.get(id)?.forEach((h) => h())
      stopHandlesMap.delete(id)
      syncingMap.delete(id)
    }

    function _initWatchers() {
      for (const handles of stopHandlesMap.values()) handles.forEach((h) => h())
      stopHandlesMap.clear()
      syncingMap.clear()
      const ws = activeWorkspace.value
      if (ws) {
        for (const id of ws.openRequestIds) registerWatchers(id)
      }
    }

    _initWatchers()

    // ── Tab / request actions ────────────────────────────────────────────────

    function addTab() {
      const ws = activeWorkspace.value
      if (!ws) return
      const id = ws.nextRequestId++
      ws.requests.push(createRequest(id))
      ws.openRequestIds.push(id)
      ws.activeRequestId = id
      registerWatchers(id)
    }

    /** Open an existing request as a tab. No-op if already open; just activates it. */
    function openRequest(requestId: number) {
      const ws = activeWorkspace.value
      if (!ws) return
      if (!ws.openRequestIds.includes(requestId)) {
        ws.openRequestIds.push(requestId)
        registerWatchers(requestId)
      }
      ws.activeRequestId = requestId
    }

    /** Close the tab (removes from the open list). The request itself is kept. */
    function closeTab(id: number) {
      const ws = activeWorkspace.value
      if (!ws) return

      unregisterWatchers(id)

      const index = ws.openRequestIds.indexOf(id)
      if (index === -1) return
      ws.openRequestIds.splice(index, 1)

      if (ws.activeRequestId === id) {
        ws.activeRequestId = ws.openRequestIds[Math.max(0, index - 1)] ?? 0
      }
    }

    /** Permanently delete a request from the workspace. */
    function deleteRequest(id: number) {
      const ws = activeWorkspace.value
      if (!ws) return

      unregisterWatchers(id)

      const openIndex = ws.openRequestIds.indexOf(id)
      if (openIndex !== -1) {
        ws.openRequestIds.splice(openIndex, 1)
        if (ws.activeRequestId === id) {
          ws.activeRequestId = ws.openRequestIds[Math.max(0, openIndex - 1)] ?? 0
        }
      }

      const reqIndex = ws.requests.findIndex((r) => r.id === id)
      if (reqIndex !== -1) ws.requests.splice(reqIndex, 1)
    }

    function closeAllTabs() {
      const ws = activeWorkspace.value
      if (!ws) return
      for (const id of [...ws.openRequestIds]) unregisterWatchers(id)
      ws.openRequestIds = []
      ws.activeRequestId = 0
    }

    function renameTab(id: number, label: string) {
      const request = activeWorkspace.value?.requests.find((r) => r.id === id)
      if (request) request.label = label
    }

    function setRequest(request: Request) {
      const tab = activeTab.value
      if (!tab) return
      const syncing = syncingMap.get(activeTabId.value)!
      syncing.value = true

      tab.method = request.method
      if (request.body != null) {
        tab.body =
          typeof request.body === 'string' ? request.body : JSON.stringify(request.body, null, 2)
        tab.bodyType = 'raw'
        tab.bodyRawSyntax = 'JSON'
      } else {
        tab.body = ''
        tab.bodyType = 'none'
      }

      tab.headers = request.headers
        ? [
            ...request.headers.map((h) => ({ active: true, data: h })),
            { active: false, data: { key: '', value: '' } },
          ]
        : []

      tab.url = request.url ?? ''
      tab.label = labelFromUrl(tab.url)

      if (request.params?.length) {
        tab.params = [
          ...request.params.map((p) => ({ active: true, data: p })),
          { active: false, data: { key: '', value: '' } },
        ]
        tab.url = mergeActiveParamsIntoUrl(tab.url, tab.params)
      } else {
        tab.params = parseSearchToParamRows(tab.url)
      }

      void nextTick(() => {
        syncing.value = false
      })
    }

    // ── Workspace actions ────────────────────────────────────────────────────

    function createWorkspaceAction(name: string) {
      const id = nextWorkspaceId.value++
      workspaces.value.push(createWorkspace(id, name.trim() || `Workspace ${id}`))
      switchWorkspace(id)
    }

    function switchWorkspace(id: number) {
      for (const handles of stopHandlesMap.values()) handles.forEach((h) => h())
      stopHandlesMap.clear()
      syncingMap.clear()
      activeWorkspaceId.value = id
      _initWatchers()
    }

    function deleteWorkspace(id: number) {
      const index = workspaces.value.findIndex((w) => w.id === id)
      if (index === -1) return
      workspaces.value.splice(index, 1)
      if (activeWorkspaceId.value === id) {
        const next = workspaces.value[Math.max(0, index - 1)]
        if (next) {
          switchWorkspace(next.id)
        } else {
          for (const handles of stopHandlesMap.values()) handles.forEach((h) => h())
          stopHandlesMap.clear()
          syncingMap.clear()
          activeWorkspaceId.value = 0
        }
      }
    }

    function $reset() {
      for (const handles of stopHandlesMap.values()) handles.forEach((h) => h())
      stopHandlesMap.clear()
      syncingMap.clear()

      workspaces.value = []
      activeWorkspaceId.value = 0
      nextWorkspaceId.value = 1
    }

    return {
      workspaces,
      activeWorkspaceId,
      nextWorkspaceId,
      activeWorkspace,
      tabs,
      activeTabId,
      activeTab,
      addTab,
      openRequest,
      closeTab,
      closeAllTabs,
      deleteRequest,
      renameTab,
      setRequest,
      createWorkspace: createWorkspaceAction,
      switchWorkspace,
      deleteWorkspace,
      _initWatchers,
      $reset,
    }
  },
  {
    persist: {
      afterHydrate: (ctx: import('pinia').PiniaPluginContext) => {
        ;(ctx.store as unknown as { _initWatchers: () => void })._initWatchers()
      },
    },
  },
)

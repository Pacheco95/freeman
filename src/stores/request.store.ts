import { computed, nextTick, ref } from 'vue'
import type { Ref, WatchStopHandle } from 'vue'
import { defineStore } from 'pinia'
import type { Method, Request } from '@/types/Request.ts'
import type { TabState } from '@/types/misc.ts'
import {
  mergeActiveParamsIntoUrl,
  parseSearchToParamRows,
  useUrlParamsSync,
} from '@/composables/useUrlParamsSync.ts'

function createTab(id: number): TabState {
  return {
    id,
    label: `Request ${id}`,
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

export const useRequestStore = defineStore(
  'request',
  () => {
    const tabs = ref<TabState[]>([createTab(1)])
    const activeTabId = ref<number>(1)
    const nextTabId = ref<number>(2)

    const activeTab = computed(() => tabs.value.find((t) => t.id === activeTabId.value)!)

    const syncingMap = new Map<number, Ref<boolean>>()
    const stopHandlesMap = new Map<number, WatchStopHandle[]>()

    function registerWatchers(id: number) {
      const syncingRef = ref(false)
      syncingMap.set(id, syncingRef)

      const urlRef = computed({
        get: () => tabs.value.find((t) => t.id === id)!.url,
        set: (v) => {
          tabs.value.find((t) => t.id === id)!.url = v
        },
      })
      const paramsRef = computed({
        get: () => tabs.value.find((t) => t.id === id)!.params,
        set: (v) => {
          tabs.value.find((t) => t.id === id)!.params = v
        },
      })

      stopHandlesMap.set(id, useUrlParamsSync(urlRef, paramsRef, syncingRef))
    }

    function _initWatchers() {
      for (const handles of stopHandlesMap.values()) {
        handles.forEach((h) => h())
      }
      stopHandlesMap.clear()
      syncingMap.clear()
      for (const tab of tabs.value) {
        registerWatchers(tab.id)
      }
    }

    registerWatchers(1)

    function addTab() {
      const id = nextTabId.value++
      tabs.value.push(createTab(id))
      registerWatchers(id)
      activeTabId.value = id
    }

    function renameTab(id: number, label: string) {
      const tab = tabs.value.find((t) => t.id === id)
      if (tab) tab.label = label
    }

    function closeTab(id: number) {
      if (tabs.value.length <= 1) return

      stopHandlesMap.get(id)?.forEach((h) => h())
      stopHandlesMap.delete(id)
      syncingMap.delete(id)

      const index = tabs.value.findIndex((t) => t.id === id)
      tabs.value.splice(index, 1)

      if (activeTabId.value === id) {
        activeTabId.value = tabs.value[Math.max(0, index - 1)]!.id
      }
    }

    function setRequest(request: Request) {
      const tab = activeTab.value
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

    function $reset() {
      for (const handles of stopHandlesMap.values()) {
        handles.forEach((h) => h())
      }
      stopHandlesMap.clear()
      syncingMap.clear()

      tabs.value = [createTab(1)]
      activeTabId.value = 1
      nextTabId.value = 2

      registerWatchers(1)
    }

    return {
      tabs,
      activeTabId,
      activeTab,
      nextTabId,
      addTab,
      closeTab,
      renameTab,
      setRequest,
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

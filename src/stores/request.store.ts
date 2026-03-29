import { defineStore } from 'pinia'
import { nextTick, ref, watch } from 'vue'
import type { Method, Request } from '@/types/Request.ts'
import type { KeyValue, ParamRow } from '@/types/misc.ts'

const URL_FALLBACK_BASE = 'https://localhost/'

function parseSearchToParamRows(urlStr: string): ParamRow[] {
  const rows: ParamRow[] = []
  try {
    const u = new URL(urlStr, URL_FALLBACK_BASE)
    for (const [key, value] of u.searchParams) {
      rows.push({ active: true, data: { key, value } })
    }
  } catch {
    return []
  }
  rows.push({ active: false, data: { key: '', value: '' } })
  return rows
}

function mergeActiveParamsIntoUrl(urlStr: string, rows: ParamRow[]): string {
  const sp = new URLSearchParams()
  for (const row of rows) {
    if (row.active) {
      sp.append(row.data.key, row.data.value)
    }
  }
  const search = sp.toString()
  const trimmed = urlStr.trim()
  if (!trimmed) {
    return search ? `?${search}` : ''
  }
  try {
    const u = new URL(urlStr, URL_FALLBACK_BASE)
    u.search = search
    if (/^https?:\/\//i.test(trimmed)) {
      return u.href
    }
    return `${u.pathname}${u.search}${u.hash}`
  } catch {
    return urlStr
  }
}

export const useRequestStore = defineStore(
  'request',
  () => {
    const activeTab = ref('params')
    const method = ref<Method>('GET')
    const url = ref('')
    const body = ref('')
    const params = ref<ParamRow[]>([])
    const headers = ref<{ active: boolean; data: KeyValue }[]>([])

    const syncing = ref(false)

    watch(
      url,
      (newUrl) => {
        if (syncing.value) {
          return
        }
        syncing.value = true
        params.value = parseSearchToParamRows(newUrl)
        void nextTick(() => {
          syncing.value = false
        })
      },
      { immediate: true },
    )

    watch(
      params,
      () => {
        if (syncing.value) {
          return
        }
        syncing.value = true
        const newUrl = mergeActiveParamsIntoUrl(url.value, params.value)
        if (newUrl !== url.value) {
          url.value = newUrl
        }
        void nextTick(() => {
          syncing.value = false
        })
      },
      { deep: true },
    )

    function setRequest(request: Request) {
      syncing.value = true

      method.value = request.method
      body.value =
        typeof request.body === 'string'
          ? request.body
          : request.body != null
            ? JSON.stringify(request.body, null, 2)
            : ''

      headers.value = request.headers
        ? [
            ...request.headers.map((h) => ({ active: true, data: h })),
            { active: false, data: { key: '', value: '' } },
          ]
        : []

      url.value = request.url ?? ''

      if (request.params?.length) {
        params.value = [
          ...request.params.map((p) => ({ active: true, data: p })),
          { active: false, data: { key: '', value: '' } },
        ]
        url.value = mergeActiveParamsIntoUrl(url.value, params.value)
      } else {
        params.value = parseSearchToParamRows(url.value)
      }

      void nextTick(() => {
        syncing.value = false
      })
    }

    return { activeTab, method, url, body, params, headers, setRequest }
  },
  {
    persist: true,
  },
)

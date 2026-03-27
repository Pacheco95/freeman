import { defineStore } from 'pinia'
import { nextTick, ref, watch } from 'vue'
import type { Method } from '@/types/Request.ts'

type KeyValue = { key: string; value: string }
type ParamRow = { active: boolean; data: KeyValue }

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

    return { method, url, body, params, headers }
  },
  {
    persist: true,
  },
)

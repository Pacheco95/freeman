import { nextTick, watch } from 'vue'
import type { Ref, WatchStopHandle } from 'vue'
import type { ParamRow } from '@/types/misc.ts'

const URL_FALLBACK_BASE = 'https://localhost/'

export function parseSearchToParamRows(urlStr: string): ParamRow[] {
  const rows: ParamRow[] = []
  try {
    const u = new URL(urlStr, URL_FALLBACK_BASE)
    for (const [key, value] of u.searchParams) {
      rows.push({ active: true, data: { key, value } })
    }
  } catch {
    return []
  }
  return rows
}

export function mergeActiveParamsIntoUrl(urlStr: string, rows: ParamRow[]): string {
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

export function useUrlParamsSync(
  url: Ref<string>,
  params: Ref<ParamRow[]>,
  syncing: Ref<boolean>,
): WatchStopHandle[] {
  const stopUrl = watch(
    url,
    (newUrl) => {
      if (syncing.value) return
      syncing.value = true
      params.value = parseSearchToParamRows(newUrl)
      void nextTick(() => {
        syncing.value = false
      })
    },
    { immediate: true },
  )

  const stopParams = watch(
    params,
    () => {
      if (syncing.value) return
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

  return [stopUrl, stopParams]
}

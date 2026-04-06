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
  // URLSearchParams encodes `{{` → `%7B%7B` and `}}` → `%7D%7D`.
  // Decode them back so template variable syntax is preserved in the stored URL.
  const search = sp
    .toString()
    .replace(/%7B%7B([^%]*?)%7D%7D/gi, (_, inner) => `{{${decodeURIComponent(inner)}}}`)

  const trimmed = urlStr.trim()
  if (!trimmed) return search ? `?${search}` : ''

  // Reconstruct using the original string rather than going through `new URL()`,
  // which would percent-encode `{{` and `}}` in the path.
  const hashIdx = trimmed.indexOf('#')
  const beforeHash = hashIdx !== -1 ? trimmed.slice(0, hashIdx) : trimmed
  const hash = hashIdx !== -1 ? trimmed.slice(hashIdx) : ''
  const qIdx = beforeHash.indexOf('?')
  const base = qIdx !== -1 ? beforeHash.slice(0, qIdx) : beforeHash

  return `${base}${search ? `?${search}` : ''}${hash}`
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

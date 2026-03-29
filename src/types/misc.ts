import type { Method } from '@/types/Request.ts'

export type KeyValue = { key: string; value: string }
export type ParamRow = { active: boolean; data: KeyValue }
export type TabState = {
  id: number
  label: string
  panelTab: string
  method: Method
  url: string
  body: string
  params: ParamRow[]
  headers: { active: boolean; data: KeyValue }[]
}

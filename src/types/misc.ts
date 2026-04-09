import type { Method } from '@/types/Request.ts'

export type KeyValue = { key: string; value: string }
export type ParamRow = { active: boolean; data: KeyValue }
export type BodyType = 'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw'
export type BodyRawSyntax = 'JSON' | 'Text' | 'JavaScript' | 'HTML' | 'XML'
export type TabState = {
  id: number
  label: string
  panelTab: string
  method: Method
  url: string
  body: string
  bodyType: BodyType
  bodyRawSyntax: BodyRawSyntax
  bodyFormRows: ParamRow[]
  params: ParamRow[]
  headers: { active: boolean; data: KeyValue }[]
}

export type Workspace = {
  id: number
  name: string
  requests: TabState[]
  openRequestIds: number[]
  activeRequestId: number
  nextRequestId: number
  variables: ParamRow[]
}

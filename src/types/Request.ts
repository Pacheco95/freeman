export const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const

export type Method = (typeof METHODS)[number]

export type Request = {
  method: Method
  url: string
  params?: Array<{ key: string; value: string }>
  headers?: Array<{ key: string; value: string }>
  body?: Record<string, unknown> | string
}

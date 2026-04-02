import { parseCurl as parse } from 'sweet-curl-parser'
import type { Method, Request } from '@/types/Request.ts'
import type { KeyValue } from '@/types/misc.ts'

export const parseCurl = (curl: string): Request => {
  const parsed = parse(curl)

  const url = new URL(parsed.data?.url.fullUrl || '')

  const params = Array.from(url.searchParams.entries()).reduce(
    (acc, [key, value]) => acc.concat({ key, value }),
    [] as KeyValue[],
  )
  const headers = parsed.data?.headers.map((header) => ({ key: header.name, value: header.value }))

  const body = (() => {
    if (!parsed.data?.body) return undefined

    if (!['json', 'raw'].includes(parsed.data.body.type ?? '')) {
      throw new Error('Not implemented')
    }

    const content = parsed.data.body.content

    if (typeof content !== 'string') {
      throw new Error('Not implemented')
    }

    const startCharacter = content.startsWith('$') ? 1 : 0
    const json = content.slice(startCharacter)
    return JSON.parse(json)
  })()

  return {
    method: (parsed.data?.method.toUpperCase() as Method) || 'GET',
    url: parsed.data?.url.fullUrl || '',
    params,
    headers,
    body,
  }
}

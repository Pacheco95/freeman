import { type Request } from '@/types/Request.ts'

const parseRequestBody = (body: Request['body']): string | undefined => {
  if (!body) {
    return undefined
  }
  if (typeof body === 'string') {
    return body
  } else {
    return JSON.stringify(body)
  }
}

export const makeRequest = async (request: Request) => {
  const urlObj = new URL(request.url)
  request.params?.forEach(({ key, value }) => urlObj.searchParams.append(key, value))

  const fullUrl = urlObj.toString()

  const headers = request.headers?.map(({ key, value }) => [key, value] as [string, string])
  const requestBody = parseRequestBody(request.body)
  const response = await fetch(fullUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? requestBody : undefined,
  })

  return response
}

import { type Request } from '@/types/Request.ts'

// RFC 7230 §3.2.6 token — only these characters are valid in a header field name.
const HTTP_TOKEN_RE = /^[!#$%&'*+\-.^_`|~A-Za-z0-9]+$/

const parseRequestBody = (body: Request['body']): BodyInit | undefined => {
  if (!body) {
    return undefined
  }
  if (typeof body === 'string' || body instanceof FormData) {
    return body
  } else {
    return JSON.stringify(body)
  }
}

export const makeRequest = async (request: Request) => {
  const urlObj = new URL(request.url)
  urlObj.search = ''
  request.params?.forEach(({ key, value }) => urlObj.searchParams.append(key, value))

  const fullUrl = urlObj.toString()

  const headers = request.headers
    ?.filter(({ key }) => HTTP_TOKEN_RE.test(key))
    .map(({ key, value }) => [key, value] as [string, string])
  const requestBody = parseRequestBody(request.body)
  const response = await fetch(fullUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? requestBody : undefined,
  })

  return response
}

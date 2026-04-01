import type { KeyValue, TabState } from '@/types/misc.ts'

export type ExportFormat =
  | 'curl'
  | 'js-fetch'
  | 'node-axios'
  | 'python-requests'
  | 'java-okhttp'
  | 'php-curl'
  | 'csharp-httpclient'

export const EXPORT_FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'curl', label: 'cURL' },
  { value: 'js-fetch', label: 'JavaScript - Fetch' },
  { value: 'node-axios', label: 'Node.js - Axios' },
  { value: 'python-requests', label: 'Python - Requests' },
  { value: 'java-okhttp', label: 'Java - OkHttp' },
  { value: 'php-curl', label: 'PHP - cURL' },
  { value: 'csharp-httpclient', label: 'C# - HttpClient' },
]

type ResolvedBody =
  | { type: 'none' }
  | { type: 'raw'; content: string }
  | { type: 'form-data'; fields: KeyValue[] }
  | { type: 'urlencoded'; fields: KeyValue[] }

function getActiveHeaders(tab: TabState): KeyValue[] {
  return tab.headers.filter((h) => h.active && h.data.key).map((h) => h.data)
}

function resolveBody(tab: TabState): ResolvedBody {
  if (tab.bodyType === 'raw' && tab.body) {
    return { type: 'raw', content: tab.body }
  }
  if (tab.bodyType === 'form-data') {
    return {
      type: 'form-data',
      fields: tab.bodyFormRows.filter((r) => r.active && r.data.key).map((r) => r.data),
    }
  }
  if (tab.bodyType === 'x-www-form-urlencoded') {
    return {
      type: 'urlencoded',
      fields: tab.bodyFormRows.filter((r) => r.active && r.data.key).map((r) => r.data),
    }
  }
  return { type: 'none' }
}

// ─── cURL ─────────────────────────────────────────────────────────────────

function generateCurl(
  url: string,
  method: string,
  headers: KeyValue[],
  body: ResolvedBody,
): string {
  const parts: string[] = [`curl --request ${method}`, `  --url '${url}'`]

  for (const h of headers) {
    parts.push(`  --header '${h.key}: ${h.value}'`)
  }

  if (body.type === 'raw') {
    parts.push(`  --data '${body.content.replace(/'/g, "'\\''")}'`)
  } else if (body.type === 'urlencoded' && body.fields.length > 0) {
    const encoded = body.fields.map((f) => `${f.key}=${f.value}`).join('&')
    parts.push(`  --data '${encoded}'`)
  } else if (body.type === 'form-data') {
    for (const f of body.fields) {
      parts.push(`  --form '${f.key}=${f.value}'`)
    }
  }

  return parts.join(' \\\n')
}

// ─── JavaScript Fetch ──────────────────────────────────────────────────────

function generateJsFetch(
  url: string,
  method: string,
  headers: KeyValue[],
  body: ResolvedBody,
): string {
  const preamble: string[] = []
  let bodyExpr: string | null = null

  if (body.type === 'form-data' && body.fields.length > 0) {
    preamble.push('const fd = new FormData()')
    body.fields.forEach((f) => preamble.push(`fd.append('${f.key}', '${f.value}')`))
    bodyExpr = 'fd'
  } else if (body.type === 'urlencoded' && body.fields.length > 0) {
    const params = body.fields.map((f) => `    '${f.key}': '${f.value}'`).join(',\n')
    bodyExpr = `new URLSearchParams({\n${params}\n  })`
  } else if (body.type === 'raw') {
    bodyExpr = JSON.stringify(body.content)
  }

  const optionLines: string[] = [`  method: '${method}'`]
  if (headers.length > 0) {
    const props = headers.map((h) => `    '${h.key}': '${h.value}'`).join(',\n')
    optionLines.push(`  headers: {\n${props}\n  }`)
  }
  if (bodyExpr) {
    optionLines.push(`  body: ${bodyExpr}`)
  }

  const lines: string[] = []
  if (preamble.length > 0) lines.push(...preamble, '')
  lines.push(
    `const response = await fetch('${url}', {`,
    optionLines.join(',\n'),
    '})',
    '',
    'const data = await response.json()',
  )
  return lines.join('\n')
}

// ─── Node.js Axios ─────────────────────────────────────────────────────────

function generateNodeAxios(
  url: string,
  method: string,
  headers: KeyValue[],
  body: ResolvedBody,
): string {
  const preamble: string[] = [`import axios from 'axios'`]
  let dataExpr: string | null = null

  if (body.type === 'form-data' && body.fields.length > 0) {
    preamble.push(`import FormData from 'form-data'`, '', 'const fd = new FormData()')
    body.fields.forEach((f) => preamble.push(`fd.append('${f.key}', '${f.value}')`))
    dataExpr = 'fd'
  } else if (body.type === 'urlencoded' && body.fields.length > 0) {
    const params = body.fields.map((f) => `    '${f.key}': '${f.value}'`).join(',\n')
    dataExpr = `new URLSearchParams({\n${params}\n  })`
  } else if (body.type === 'raw') {
    dataExpr = JSON.stringify(body.content)
  }

  const optionLines: string[] = [`  method: '${method.toLowerCase()}'`, `  url: '${url}'`]

  if (body.type === 'form-data' && body.fields.length > 0) {
    if (headers.length > 0) {
      const props = headers.map((h) => `    '${h.key}': '${h.value}'`).join(',\n')
      optionLines.push(`  headers: { ...fd.getHeaders(),\n${props}\n  }`)
    } else {
      optionLines.push(`  headers: fd.getHeaders()`)
    }
  } else if (headers.length > 0) {
    const props = headers.map((h) => `    '${h.key}': '${h.value}'`).join(',\n')
    optionLines.push(`  headers: {\n${props}\n  }`)
  }

  if (dataExpr) {
    optionLines.push(`  data: ${dataExpr}`)
  }

  return [...preamble, '', 'const { data } = await axios({', optionLines.join(',\n'), '})'].join(
    '\n',
  )
}

// ─── Python Requests ───────────────────────────────────────────────────────

function generatePythonRequests(
  url: string,
  method: string,
  headers: KeyValue[],
  body: ResolvedBody,
): string {
  const callArgs: string[] = [`    '${url}'`]

  if (headers.length > 0) {
    const props = headers.map((h) => `        '${h.key}': '${h.value}'`).join(',\n')
    callArgs.push(`    headers={\n${props}\n    }`)
  }

  if (body.type === 'raw') {
    callArgs.push(`    data=${JSON.stringify(body.content)}`)
  } else if (body.type === 'urlencoded' && body.fields.length > 0) {
    const params = body.fields.map((f) => `        '${f.key}': '${f.value}'`).join(',\n')
    callArgs.push(`    data={\n${params}\n    }`)
  } else if (body.type === 'form-data' && body.fields.length > 0) {
    const fields = body.fields.map((f) => `        '${f.key}': (None, '${f.value}')`).join(',\n')
    callArgs.push(`    files={\n${fields}\n    }`)
  }

  return [
    'import requests',
    '',
    `response = requests.${method.toLowerCase()}(`,
    callArgs.join(',\n'),
    ')',
    '',
    'print(response.json())',
  ].join('\n')
}

// ─── Java OkHttp ───────────────────────────────────────────────────────────

function generateJavaOkHttp(
  url: string,
  method: string,
  headers: KeyValue[],
  body: ResolvedBody,
): string {
  const lines: string[] = ['OkHttpClient client = new OkHttpClient();', '']
  let bodyVar = 'null'

  if (body.type === 'raw') {
    lines.push(`MediaType mediaType = MediaType.parse("application/json");`)
    lines.push(`RequestBody body = RequestBody.create(mediaType, ${JSON.stringify(body.content)});`)
    lines.push('')
    bodyVar = 'body'
  } else if (body.type === 'urlencoded' && body.fields.length > 0) {
    lines.push('FormBody body = new FormBody.Builder()')
    body.fields.forEach((f) => lines.push(`    .add("${f.key}", "${f.value}")`))
    lines.push('    .build();', '')
    bodyVar = 'body'
  } else if (body.type === 'form-data' && body.fields.length > 0) {
    lines.push('MultipartBody body = new MultipartBody.Builder()')
    lines.push('    .setType(MultipartBody.FORM)')
    body.fields.forEach((f) => lines.push(`    .addFormDataPart("${f.key}", "${f.value}")`))
    lines.push('    .build();', '')
    bodyVar = 'body'
  }

  lines.push('Request request = new Request.Builder()')
  lines.push(`    .url("${url}")`)

  if (bodyVar !== 'null' || method !== 'GET') {
    lines.push(`    .method("${method}", ${bodyVar})`)
  }

  for (const h of headers) {
    lines.push(`    .addHeader("${h.key}", "${h.value}")`)
  }
  lines.push('    .build();', '', 'Response response = client.newCall(request).execute();')

  return lines.join('\n')
}

// ─── PHP cURL ──────────────────────────────────────────────────────────────

function generatePhpCurl(
  url: string,
  method: string,
  headers: KeyValue[],
  body: ResolvedBody,
): string {
  const opts: string[] = [
    `    CURLOPT_URL => "${url}",`,
    `    CURLOPT_RETURNTRANSFER => true,`,
    `    CURLOPT_CUSTOMREQUEST => "${method}",`,
  ]

  if (body.type === 'raw') {
    opts.push(`    CURLOPT_POSTFIELDS => ${JSON.stringify(body.content)},`)
  } else if (body.type === 'urlencoded' && body.fields.length > 0) {
    const data = body.fields.map((f) => `${f.key}=${f.value}`).join('&')
    opts.push(`    CURLOPT_POSTFIELDS => "${data}",`)
  }

  if (headers.length > 0) {
    const headerLines = headers.map((h) => `        "${h.key}: ${h.value}"`).join(',\n')
    opts.push(`    CURLOPT_HTTPHEADER => [\n${headerLines}\n    ],`)
  }

  return [
    '<?php',
    '',
    '$curl = curl_init();',
    '',
    'curl_setopt_array($curl, [',
    ...opts,
    ']);',
    '',
    '$response = curl_exec($curl);',
    '$err = curl_error($curl);',
    '',
    'curl_close($curl);',
    '',
    'if ($err) {',
    '    echo "cURL Error: " . $err;',
    '} else {',
    '    echo $response;',
    '}',
  ].join('\n')
}

// ─── C# HttpClient ─────────────────────────────────────────────────────────

function generateCsharpHttpClient(
  url: string,
  method: string,
  headers: KeyValue[],
  body: ResolvedBody,
): string {
  const lines: string[] = [
    'using System.Net.Http;',
    'using System.Text;',
    '',
    'using var client = new HttpClient();',
    '',
  ]

  for (const h of headers) {
    lines.push(`client.DefaultRequestHeaders.Add("${h.key}", "${h.value}");`)
  }
  if (headers.length > 0) lines.push('')

  const methodEnum = `HttpMethod.${method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()}`

  if (body.type === 'raw') {
    lines.push(
      `var content = new StringContent(${JSON.stringify(body.content)}, Encoding.UTF8, "application/json");`,
    )
  } else if (body.type === 'urlencoded' && body.fields.length > 0) {
    const pairs = body.fields.map((f) => `    { "${f.key}", "${f.value}" }`).join(',\n')
    lines.push(
      `var content = new FormUrlEncodedContent(new Dictionary<string, string>\n{\n${pairs}\n});`,
    )
  }

  const hasContent = body.type === 'raw' || (body.type === 'urlencoded' && body.fields.length > 0)

  lines.push(
    `var request = new HttpRequestMessage(${methodEnum}, "${url}")${hasContent ? ' { Content = content }' : ''};`,
    'var response = await client.SendAsync(request);',
    'var responseBody = await response.Content.ReadAsStringAsync();',
    '',
    'Console.WriteLine(responseBody);',
  )

  return lines.join('\n')
}

// ─── Public API ────────────────────────────────────────────────────────────

export function generateCode(tab: TabState, format: ExportFormat): string {
  const url = tab.url || ''
  const method = tab.method
  const headers = getActiveHeaders(tab)
  const body = resolveBody(tab)

  switch (format) {
    case 'curl':
      return generateCurl(url, method, headers, body)
    case 'js-fetch':
      return generateJsFetch(url, method, headers, body)
    case 'node-axios':
      return generateNodeAxios(url, method, headers, body)
    case 'python-requests':
      return generatePythonRequests(url, method, headers, body)
    case 'java-okhttp':
      return generateJavaOkHttp(url, method, headers, body)
    case 'php-curl':
      return generatePhpCurl(url, method, headers, body)
    case 'csharp-httpclient':
      return generateCsharpHttpClient(url, method, headers, body)
  }
}

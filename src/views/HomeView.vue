<script setup lang="ts">
import { ref } from 'vue'
import RequestForm, { type RequestFormData } from '@/components/RequestForm.vue'
import type { Method } from '@/components/MethodSelect.vue'
import ObjTable from '@/components/ObjTable.vue'
import BodyEditor from '@/components/BodyEditor.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const method = ref<Method>('POST')
const url = ref('https://echo.free.beeceptor.com')
const body = ref(JSON.stringify({ foo: 'bar' }, null, 2))
const responseBody = ref('')

type Obj = { key: string; value: string }

const columns = ref<
  {
    title: string
    field: keyof Obj
  }[]
>([
  { title: 'Key', field: 'key' },
  { title: 'Value', field: 'value' },
])

const params = ref<{ active: boolean; data: Obj }[]>([
  { active: true, data: { key: 'foo', value: 'bar' } },
  {
    active: false,
    data: { key: 'a', value: 'n' },
  },
])

const headers = ref<{ active: boolean; data: Obj }[]>([
  { active: true, data: { key: 'Authorization', value: 'Bearer <token>' } },
  {
    active: true,
    data: { key: 'Content-Type', value: 'application/json' },
  },
])

const handleSubmit = async (values: RequestFormData) => {
  try {
    // Build URL with active params
    const urlObj = new URL(values.url)
    params.value.forEach((param) => {
      if (param.active) {
        urlObj.searchParams.append(param.data.key, param.data.value)
      }
    })
    const fullUrl = urlObj.toString()

    // Build headers
    const requestHeaders: Record<string, string> = {}
    headers.value.forEach((header) => {
      if (header.active) {
        requestHeaders[header.data.key] = header.data.value
      }
    })

    // Make request
    const response = await fetch(fullUrl, {
      method: values.method,
      headers: requestHeaders,
      body: values.method !== 'GET' && values.method !== 'HEAD' ? body.value : undefined,
    })

    responseBody.value = await response.text()
  } catch (error) {
    responseBody.value = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
</script>

<template>
  <main class="p-4 flex flex-col gap-4 h-screen">
    <RequestForm v-model:method="method" v-model:url="url" @submit="handleSubmit" />

    <div class="flex-1">
      <Tabs default-value="body" :unmount-on-hide="false">
        <TabsList>
          <TabsTrigger value="params">Params</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
        </TabsList>
        <TabsContent value="params">
          <ObjTable :columns="columns" v-model:rows="params" />
        </TabsContent>
        <TabsContent value="headers">
          <ObjTable :columns="columns" v-model:rows="headers" />
        </TabsContent>
        <TabsContent value="body">
          <BodyEditor v-model="body" />
        </TabsContent>
        <TabsContent value="response">
          <BodyEditor v-model="responseBody" :readOnly="true" />
        </TabsContent>
      </Tabs>
    </div>
  </main>
</template>

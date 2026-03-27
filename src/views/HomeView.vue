<script setup lang="ts">
import { computed, ref } from 'vue'
import RequestForm, { type RequestFormData } from '@/components/RequestForm.vue'
import ObjTable from '@/components/ObjTable.vue'
import BodyEditor from '@/components/BodyEditor.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Request } from '@/types/Request.ts'
import { makeRequest } from '@/services/request.service.ts'
import HttpStatusIndicator from '@/components/HttpStatusIndicator.vue'
import { useRequestStore } from '@/stores/request.store.ts'

type Obj = { key: string; value: string }

const requestStore = useRequestStore()
const responseBody = ref('')

const columns = [
  { title: 'Key', field: 'key' },
  { title: 'Value', field: 'value' },
] as const as Array<{
  title: string
  field: keyof Obj
}>

const response = ref<Response | null>(null)

const responseHeaders = computed(() => {
  if (!response.value) {
    return []
  }
  const headersArray: { key: string; value: string }[] = []
  response.value.headers.forEach((value, key) => {
    headersArray.push({ key, value })
  })
  return headersArray
})

const handleSubmit = async (values: RequestFormData) => {
  try {
    const params = requestStore.params.filter((param) => param.active).map((param) => param.data)
    const request: Request = {
      method: values.method,
      url: values.url,
      params: params,
      headers: requestStore.headers.filter((header) => header.active).map((header) => header.data),
      body: requestStore.body,
    }

    response.value = await makeRequest(request)

    responseBody.value = await response.value.text()
  } catch (error) {
    responseBody.value = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
</script>

<template>
  <main class="p-4 flex flex-col gap-4 h-screen">
    <RequestForm
      v-model:method="requestStore.method"
      v-model:url="requestStore.url"
      @submit="handleSubmit"
    />

    <div class="flex-1 flex flex-col gap-4">
      <section class="flex-1">
        <Tabs class="h-full flex flex-col" default-value="params" :unmount-on-hide="false">
          <TabsList>
            <TabsTrigger value="params">Params</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
          </TabsList>
          <TabsContent value="params">
            <ObjTable :columns="columns" v-model:rows="requestStore.params" />
          </TabsContent>
          <TabsContent value="headers">
            <ObjTable :columns="columns" v-model:rows="requestStore.headers" />
          </TabsContent>
          <TabsContent value="body" class="h-full flex flex-col">
            <BodyEditor v-model="requestStore.body" />
          </TabsContent>
        </Tabs>
      </section>

      <section class="flex-1">
        <Tabs class="h-full flex flex-col" default-value="body" :unmount-on-hide="false">
          <div class="flex items-center gap-4">
            <TabsList>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
            </TabsList>
            <HttpStatusIndicator v-if="response" :status="response.status" />
          </div>
          <TabsContent value="headers">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="row in responseHeaders" :key="row.key">
                  <TableCell>
                    {{ row.key }}
                  </TableCell>
                  <TableCell class="w-8">
                    {{ row.value }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="body" class="h-full flex flex-col">
            <BodyEditor v-model="responseBody" :readOnly="true" />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FileX } from 'lucide-vue-next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import HttpStatusIndicator from '@/components/HttpStatusIndicator.vue'
import WaitingResponse from '@/components/WaitingResponse.vue'
import BodyEditor from '@/components/BodyEditor.vue'
import type { KeyValue } from '@/types/misc.ts'

const props = defineProps<{
  response: Response | null | undefined
  body: string | undefined
}>()

const responseHeaders = computed<KeyValue[]>(() => {
  if (!props.response) return []
  const headersArray: KeyValue[] = []
  props.response.headers.forEach((value, key) => {
    headersArray.push({ key, value })
  })
  return headersArray
})

const bodyLanguage = computed(() => {
  const contentType = props.response?.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) return 'json'
  if (contentType.includes('text/html')) return 'html'
  if (contentType.includes('xml')) return 'xml'
  if (contentType.includes('text/css')) return 'css'
  if (contentType.includes('javascript')) return 'javascript'
  return 'plaintext'
})
</script>

<template>
  <section class="flex-1 flex flex-col min-h-0">
    <Tabs
      v-if="response && body"
      class="flex-1 flex flex-col min-h-0"
      default-value="body"
      :unmount-on-hide="false"
    >
      <div class="flex items-center gap-4">
        <TabsList>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
        </TabsList>
        <HttpStatusIndicator :status="response.status" />
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
              <TableCell>{{ row.key }}</TableCell>
              <TableCell class="w-8">{{ row.value }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent value="body" class="min-h-0 flex flex-col">
        <BodyEditor :model-value="body" :readOnly="true" :language="bodyLanguage" />
      </TabsContent>
    </Tabs>
    <Empty v-else-if="response">
      <EmptyHeader>
        <EmptyMedia variant="icon" class="w-24 h-24">
          <FileX :style="{ width: '4rem', height: '4rem' }" />
        </EmptyMedia>
        <EmptyTitle>No response body</EmptyTitle>
        <EmptyDescription>The request completed but didn't return a body</EmptyDescription>
      </EmptyHeader>
    </Empty>
    <WaitingResponse v-else />
  </section>
</template>

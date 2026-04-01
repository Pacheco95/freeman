<script setup lang="ts">
import { computed } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
</script>

<template>
  <section class="flex-1 flex flex-col min-h-0">
    <Tabs
      v-if="body"
      class="flex-1 flex flex-col min-h-0"
      default-value="body"
      :unmount-on-hide="false"
    >
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
              <TableCell>{{ row.key }}</TableCell>
              <TableCell class="w-8">{{ row.value }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent value="body" class="min-h-0 flex flex-col">
        <BodyEditor :model-value="body ?? ''" :readOnly="true" />
      </TabsContent>
    </Tabs>
    <WaitingResponse v-else />
  </section>
</template>

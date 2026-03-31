<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import type { Request } from '@/types/Request.ts'
import { makeRequest } from '@/services/request.service.ts'
import HttpStatusIndicator from '@/components/HttpStatusIndicator.vue'
import { useRequestStore } from '@/stores/request.store.ts'
import ImportCurlDialog from '@/components/ImportCurlDialog.vue'
import MenuBar from '@/components/MenuBar.vue'
import { useUIStore } from '@/stores/ui.store.ts'
import { isTauriEnv } from '@/util.ts'
import WaitingResponse from '@/components/WaitingResponse.vue'
import RequestTab from '@/components/RequestTab.vue'
import BodyEditor from '@/components/BodyEditor.vue'
import type { KeyValue } from '@/types/misc.ts'

type TabResponse = { response: Response | null; body: string }

const ui = useUIStore()
const requestStore = useRequestStore()

const responses = ref<Record<number, TabResponse>>({})
const currentResponse = computed<TabResponse | undefined>(
  () => responses.value[requestStore.activeTabId],
)

const responseHeaders = computed(() => {
  if (!currentResponse.value?.response) {
    return []
  }
  const headersArray: KeyValue[] = []
  currentResponse.value.response.headers.forEach((value, key) => {
    headersArray.push({ key, value })
  })
  return headersArray
})

const handleNewRequest = async () => {
  const tab = requestStore.activeTab
  const tabId = requestStore.activeTabId
  try {
    let body: Request['body'] = undefined
    if (tab.bodyType === 'raw') {
      body = tab.body
    } else if (tab.bodyType === 'form-data') {
      const fd = new FormData()
      tab.bodyFormRows.filter((r) => r.active).forEach((r) => fd.append(r.data.key, r.data.value))
      body = fd
    } else if (tab.bodyType === 'x-www-form-urlencoded') {
      const params = new URLSearchParams()
      tab.bodyFormRows
        .filter((r) => r.active)
        .forEach((r) => params.append(r.data.key, r.data.value))
      body = params.toString()
    }
    const request: Request = {
      method: tab.method,
      url: tab.url,
      params: tab.params.filter((p) => p.active).map((p) => p.data),
      headers: tab.headers.filter((h) => h.active).map((h) => h.data),
      body,
    }
    const r = await makeRequest(request)
    responses.value[tabId] = { response: r, body: await r.text() }
  } catch (error) {
    responses.value[tabId] = {
      response: null,
      body: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

const handleCurlImport = (request: Request) => {
  requestStore.addTab()
  ui.closeImportModal()
  requestStore.setRequest(request)
}
</script>

<template>
  <main class="p-4 flex flex-col gap-4 h-screen">
    <MenuBar v-if="!isTauriEnv()" />
    <ImportCurlDialog v-model:open="ui.importModalOpen" @submit="handleCurlImport" />

    <div class="flex items-center gap-2">
      <Tabs
        :model-value="String(requestStore.activeTabId)"
        @update:model-value="requestStore.activeTabId = Number($event)"
      >
        <TabsList>
          <TabsTrigger
            v-for="tab in requestStore.tabs"
            :key="tab.id"
            :value="String(tab.id)"
            class="gap-1"
          >
            {{ tab.label }}
            <button
              v-if="requestStore.tabs.length > 1"
              class="rounded-sm opacity-60 hover:opacity-100"
              @click.stop="requestStore.closeTab(tab.id)"
            >
              <X class="h-3 w-3" />
            </button>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Button variant="ghost" size="sm" @click="requestStore.addTab()">
        <Plus class="h-4 w-4" />
      </Button>
    </div>

    <RequestTab
      v-for="tab in requestStore.tabs"
      v-show="tab.id === requestStore.activeTabId"
      :key="tab.id"
      :tab-id="tab.id"
      @submit="handleNewRequest"
    />

    <section class="flex-1">
      <Tabs
        v-if="currentResponse?.body"
        class="h-full flex flex-col"
        default-value="body"
        :unmount-on-hide="false"
      >
        <div class="flex items-center gap-4">
          <TabsList>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
          </TabsList>
          <HttpStatusIndicator
            v-if="currentResponse.response"
            :status="currentResponse.response.status"
          />
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
        <TabsContent value="body" class="h-full flex flex-col">
          <BodyEditor :model-value="currentResponse?.body ?? ''" :readOnly="true" />
        </TabsContent>
      </Tabs>
      <WaitingResponse v-else />
    </section>
  </main>
</template>

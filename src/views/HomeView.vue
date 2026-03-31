<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Request } from '@/types/Request.ts'
import { makeRequest } from '@/services/request.service.ts'
import { useRequestStore } from '@/stores/request.store.ts'
import ImportCurlDialog from '@/components/ImportCurlDialog.vue'
import MenuBar from '@/components/MenuBar.vue'
import { useUIStore } from '@/stores/ui.store.ts'
import { isTauriEnv } from '@/util.ts'
import RequestTab from '@/components/RequestTab.vue'
import RequestTabBar from '@/components/RequestTabBar.vue'
import ResponsePanel from '@/components/ResponsePanel.vue'

type TabResponse = { response: Response | null; body: string }

const ui = useUIStore()
const requestStore = useRequestStore()

const responses = ref<Record<number, TabResponse>>({})
const currentResponse = computed<TabResponse | undefined>(
  () => responses.value[requestStore.activeTabId],
)

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

    <RequestTabBar
      v-model:activeTabId="requestStore.activeTabId"
      :tabs="requestStore.tabs"
      @close-tab="requestStore.closeTab"
      @add-tab="requestStore.addTab"
    />

    <RequestTab
      v-for="tab in requestStore.tabs"
      v-show="tab.id === requestStore.activeTabId"
      :key="tab.id"
      :tab-id="tab.id"
      @submit="handleNewRequest"
    />

    <ResponsePanel :response="currentResponse?.response" :body="currentResponse?.body" />
  </main>
</template>

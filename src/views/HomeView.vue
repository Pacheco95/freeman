<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Code2 } from 'lucide-vue-next'
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
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import CodeExportToolbar from '@/components/CodeExportToolbar.vue'

type TabResponse = { response: Response | null; body: string }

const ui = useUIStore()
const requestStore = useRequestStore()

const isMobile = useMediaQuery('(max-width: 767px)')
const codeToolbarOpen = ref(false)

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

    <div class="flex flex-1 min-h-0">
      <ResizablePanelGroup direction="horizontal" class="flex-1 min-h-0">
        <ResizablePanel class="flex flex-col min-h-0">
          <ResizablePanelGroup direction="vertical" class="flex-1 min-h-0">
            <ResizablePanel :default-size="50" class="flex flex-col min-h-0">
              <RequestTab
                v-for="tab in requestStore.tabs"
                v-show="tab.id === requestStore.activeTabId"
                :key="tab.id"
                :tab-id="tab.id"
                @submit="handleNewRequest"
              />
            </ResizablePanel>
            <ResizableHandle with-handle class="mt-3" />
            <ResizablePanel :default-size="50" class="flex flex-col min-h-0 mt-2">
              <ResponsePanel :response="currentResponse?.response" :body="currentResponse?.body" />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <template v-if="codeToolbarOpen && !isMobile">
          <ResizableHandle with-handle class="mx-2" />
          <ResizablePanel :default-size="25" :min-size="10" class="flex flex-col min-h-0">
            <CodeExportToolbar @close="codeToolbarOpen = false" />
          </ResizablePanel>
        </template>

        <Sheet v-if="isMobile" v-model:open="codeToolbarOpen">
          <SheetContent>
            <CodeExportToolbar @close="codeToolbarOpen = false" />
          </SheetContent>
        </Sheet>
      </ResizablePanelGroup>

      <div class="flex flex-col items-center border-l pl-4 shrink-0 mx-auto">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :class="{ 'bg-accent': codeToolbarOpen }"
          title="Code snippet"
          @click="codeToolbarOpen = !codeToolbarOpen"
        >
          <Code2 class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Code2, Plus } from 'lucide-vue-next'
import type { Request } from '@/types/Request.ts'
import { makeRequest } from '@/services/request.service.ts'
import { useRequestStore } from '@/stores/request.store.ts'
import ImportCurlDialog from '@/components/ImportCurlDialog.vue'
import MenuBar from '@/components/MenuBar.vue'
import { useUIStore } from '@/stores/ui.store.ts'
import { isTauriEnv } from '@/util.ts'
import RequestTab from '@/components/RequestTab.vue'
import RequestTabBar from '@/components/RequestTabBar.vue'
import WorkspaceSidebar from '@/components/WorkspaceSidebar.vue'
import ResponsePanel from '@/components/ResponsePanel.vue'
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport } from 'reka-ui'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollBar } from '@/components/ui/scroll-area'
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
  if (!tab) return
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

const pendingImport = ref<Request | null>(null)
const workspaceNameForImport = ref('')

const handleCurlImport = (request: Request) => {
  ui.closeImportModal()
  if (requestStore.workspaces.length === 0) {
    pendingImport.value = request
    workspaceNameForImport.value = ''
    return
  }
  requestStore.addTab()
  requestStore.setRequest(request)
}

function confirmImportWithWorkspace() {
  if (!workspaceNameForImport.value.trim() || !pendingImport.value) return
  requestStore.createWorkspace(workspaceNameForImport.value)
  requestStore.addTab()
  requestStore.setRequest(pendingImport.value)
  pendingImport.value = null
}
</script>

<template>
  <main class="flex flex-col h-screen overflow-hidden">
    <MenuBar v-if="!isTauriEnv()" />
    <ImportCurlDialog v-model:open="ui.importModalOpen" @submit="handleCurlImport" />

    <!-- Workspace name prompt shown when importing cURL with no workspace -->
    <Dialog
      :open="pendingImport !== null"
      @update:open="
        (v) => {
          if (!v) pendingImport = null
        }
      "
    >
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Name your workspace</DialogTitle>
        </DialogHeader>
        <Input
          v-model="workspaceNameForImport"
          placeholder="Workspace name"
          autofocus
          @keydown.enter="confirmImportWithWorkspace"
          @keydown.esc="pendingImport = null"
        />
        <DialogFooter>
          <Button variant="outline" @click="pendingImport = null">Cancel</Button>
          <Button :disabled="!workspaceNameForImport.trim()" @click="confirmImportWithWorkspace">
            Create & Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <div class="flex flex-1 min-h-0">
      <ResizablePanelGroup direction="horizontal" class="flex-1 min-h-0">
        <!-- Workspace sidebar -->
        <ResizablePanel :default-size="18" :min-size="12" :max-size="35">
          <WorkspaceSidebar class="h-full" />
        </ResizablePanel>

        <ResizableHandle with-handle />

        <!-- Main content -->
        <ResizablePanel :default-size="82" class="flex flex-col min-h-0">
          <div class="flex flex-col flex-1 min-h-0 p-4 gap-4">
            <!-- Tab bar -->
            <div v-if="requestStore.tabs.length > 0" class="flex items-center gap-2">
              <Button variant="ghost" size="sm" class="shrink-0" @click="requestStore.addTab()">
                <Plus class="h-4 w-4" />
              </Button>
              <ScrollAreaRoot class="relative flex-1 min-w-0">
                <ScrollAreaViewport class="w-full">
                  <RequestTabBar
                    v-model:activeTabId="requestStore.activeTabId"
                    :tabs="requestStore.tabs"
                    @close-tab="requestStore.closeTab"
                    @close-all-tabs="requestStore.closeAllTabs"
                    @rename-tab="requestStore.renameTab"
                  />
                </ScrollAreaViewport>
                <ScrollBar orientation="horizontal" />
                <ScrollAreaCorner />
              </ScrollAreaRoot>
              <Button
                class="md:hidden shrink-0 h-8 w-8"
                variant="ghost"
                size="icon"
                :class="{ 'bg-accent': codeToolbarOpen }"
                title="Code snippet"
                @click="codeToolbarOpen = !codeToolbarOpen"
              >
                <Code2 class="h-4 w-4" />
              </Button>
            </div>

            <!-- Request / response panels -->
            <div class="flex flex-1 min-h-0">
              <template v-if="requestStore.tabs.length > 0">
                <ResizablePanelGroup direction="horizontal" class="flex-1 min-h-0">
                  <ResizablePanel class="flex flex-col min-h-0">
                    <ResizablePanelGroup direction="vertical" class="flex-1 min-h-0">
                      <ResizablePanel :default-size="50" class="flex flex-col min-h-0">
                        <RequestTab
                          v-for="tab in requestStore.tabs"
                          v-show="tab.id === requestStore.activeTabId"
                          :key="`${requestStore.activeWorkspaceId}-${tab.id}`"
                          :tab-id="tab.id"
                          @submit="handleNewRequest"
                        />
                      </ResizablePanel>
                      <ResizableHandle with-handle class="mt-3" />
                      <ResizablePanel :default-size="50" class="flex flex-col min-h-0 mt-2">
                        <ResponsePanel
                          :response="currentResponse?.response"
                          :body="currentResponse?.body"
                        />
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </ResizablePanel>

                  <template v-if="codeToolbarOpen && !isMobile">
                    <ResizableHandle with-handle class="mx-2" />
                    <ResizablePanel :default-size="25" :min-size="10" class="flex flex-col min-h-0">
                      <CodeExportToolbar @close="codeToolbarOpen = false" />
                    </ResizablePanel>
                  </template>
                </ResizablePanelGroup>

                <Dialog v-if="isMobile" v-model:open="codeToolbarOpen">
                  <DialogContent class="flex flex-col gap-0 p-0 h-[80vh] overflow-hidden">
                    <CodeExportToolbar :show-close-button="false" />
                  </DialogContent>
                </Dialog>

                <div class="hidden md:flex flex-col items-center border-l pl-4 shrink-0 mx-auto">
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
              </template>

              <!-- Empty state: no workspace -->
              <div
                v-else-if="requestStore.workspaces.length === 0"
                class="flex-1 flex flex-col items-center justify-center gap-4 text-center"
              >
                <p class="text-muted-foreground text-sm">Create a workspace to get started</p>
                <Button variant="outline" @click="ui.openCreateWorkspaceModal()">
                  <Plus class="h-4 w-4 mr-1" />
                  New Workspace
                </Button>
              </div>

              <!-- Empty state: no open requests -->
              <div
                v-else
                class="flex-1 flex flex-col items-center justify-center gap-4 text-center"
              >
                <p class="text-muted-foreground text-sm">No requests open</p>
                <div class="flex gap-2">
                  <Button variant="outline" @click="requestStore.addTab()">
                    <Plus class="h-4 w-4 mr-1" />
                    New Request
                  </Button>
                  <Button variant="outline" @click="ui.openImportModal()">Import cURL</Button>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  </main>
</template>

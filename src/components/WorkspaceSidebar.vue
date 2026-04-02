<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useRequestStore } from '@/stores/request.store.ts'
import type { TabState } from '@/types/misc.ts'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const store = useRequestStore()

// ── Workspace creation ───────────────────────────────────────────────────────
const showCreateWorkspace = ref(false)
const newWorkspaceName = ref('')

function openCreateWorkspace() {
  newWorkspaceName.value = ''
  showCreateWorkspace.value = true
}

function createWorkspace() {
  if (!newWorkspaceName.value.trim()) return
  store.createWorkspace(newWorkspaceName.value)
  showCreateWorkspace.value = false
}

// ── Request deletion ─────────────────────────────────────────────────────────
const showDeleteConfirm = ref(false)
const requestToDelete = ref<TabState | null>(null)

function promptDelete(request: TabState) {
  requestToDelete.value = request
  showDeleteConfirm.value = true
}

function confirmDelete() {
  if (requestToDelete.value) store.deleteRequest(requestToDelete.value.id)
  showDeleteConfirm.value = false
  requestToDelete.value = null
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const METHOD_COLORS: Record<string, string> = {
  GET: 'text-green-500',
  POST: 'text-blue-500',
  PUT: 'text-amber-500',
  PATCH: 'text-purple-500',
  DELETE: 'text-red-500',
  HEAD: 'text-gray-400',
  OPTIONS: 'text-gray-400',
}

function methodColor(method: string) {
  return METHOD_COLORS[method] ?? 'text-gray-400'
}
</script>

<template>
  <div class="flex flex-col h-full border-r select-none">
    <!-- Workspace selector -->
    <div class="flex items-center gap-1 p-2 border-b">
      <Select
        :model-value="String(store.activeWorkspaceId)"
        @update:model-value="store.switchWorkspace(Number($event))"
      >
        <SelectTrigger class="flex-1 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="ws in store.workspaces" :key="ws.id" :value="String(ws.id)">
            {{ ws.name }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8 shrink-0"
        title="New workspace"
        @click="openCreateWorkspace"
      >
        <Plus class="h-4 w-4" />
      </Button>
    </div>

    <!-- Requests header -->
    <div class="flex items-center justify-between px-3 py-2">
      <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >Requests</span
      >
      <Button
        variant="ghost"
        size="icon"
        class="h-6 w-6"
        title="New request"
        @click="store.addTab()"
      >
        <Plus class="h-3 w-3" />
      </Button>
    </div>

    <!-- Request tree -->
    <div class="flex-1 overflow-y-auto px-1 pb-2">
      <ContextMenu v-for="request in store.activeWorkspace.requests" :key="request.id">
        <ContextMenuTrigger as-child>
          <button
            class="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm hover:bg-accent transition-colors"
            :class="{ 'bg-accent': store.activeTabId === request.id }"
            @click="store.openRequest(request.id)"
          >
            <span
              class="font-mono text-xs font-bold w-16 shrink-0 text-left truncate"
              :class="methodColor(request.method)"
              >{{ request.method }}</span
            >
            <span class="truncate flex-1 text-left">{{ request.label }}</span>
            <!-- dot indicator: request is open as a tab -->
            <span
              v-if="store.activeWorkspace.openRequestIds.includes(request.id)"
              class="h-1.5 w-1.5 rounded-full bg-primary shrink-0"
            />
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem @click="store.openRequest(request.id)">Open</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            class="text-destructive focus:text-destructive"
            @click="promptDelete(request)"
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  </div>

  <!-- Create workspace dialog -->
  <Dialog v-model:open="showCreateWorkspace">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>New Workspace</DialogTitle>
      </DialogHeader>
      <Input
        v-model="newWorkspaceName"
        placeholder="Workspace name"
        autofocus
        @keydown.enter="createWorkspace"
        @keydown.esc="showCreateWorkspace = false"
      />
      <DialogFooter>
        <Button variant="outline" @click="showCreateWorkspace = false">Cancel</Button>
        <Button :disabled="!newWorkspaceName.trim()" @click="createWorkspace">Create</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete confirmation dialog -->
  <Dialog v-model:open="showDeleteConfirm">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Delete request?</DialogTitle>
        <DialogDescription>
          "{{ requestToDelete?.label }}" will be permanently deleted. This cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="showDeleteConfirm = false">Cancel</Button>
        <Button variant="destructive" @click="confirmDelete">Delete</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { X } from 'lucide-vue-next'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TabState } from '@/types/misc.ts'

defineProps<{ tabs: TabState[] }>()

const activeTabId = defineModel<number>('activeTabId', { required: true })

const emit = defineEmits<{
  closeTab: [id: number]
  renameTab: [id: number, label: string]
}>()

const editingTabId = ref<number | null>(null)
const editingLabel = ref('')

async function startEditing(tab: TabState) {
  editingTabId.value = tab.id
  editingLabel.value = tab.label
  await nextTick()
  const input = document.getElementById(`tab-rename-${tab.id}`) as HTMLInputElement | null
  input?.select()
}

function commitRename() {
  if (editingTabId.value === null) return
  const trimmed = editingLabel.value.trim()
  if (trimmed) emit('renameTab', editingTabId.value, trimmed)
  editingTabId.value = null
}

function cancelRename() {
  editingTabId.value = null
}
</script>

<template>
  <Tabs :model-value="String(activeTabId)" @update:model-value="activeTabId = Number($event)">
    <TabsList>
      <TabsTrigger v-for="tab in tabs" :key="tab.id" :value="String(tab.id)" class="gap-1">
        <input
          v-if="editingTabId === tab.id"
          :id="`tab-rename-${tab.id}`"
          v-model="editingLabel"
          class="bg-transparent outline-none w-24 text-sm"
          @blur="commitRename"
          @keydown.enter.prevent="commitRename"
          @keydown.esc.prevent="cancelRename"
          @click.stop
          @dblclick.stop
        />
        <span v-else @dblclick.stop="startEditing(tab)">{{ tab.label }}</span>
        <button
          class="rounded-sm opacity-60 hover:opacity-100"
          @click.stop="emit('closeTab', tab.id)"
        >
          <X class="h-3 w-3" />
        </button>
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>

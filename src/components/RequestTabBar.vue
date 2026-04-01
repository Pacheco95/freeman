<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { TabState } from '@/types/misc.ts'

defineProps<{ tabs: TabState[] }>()

const activeTabId = defineModel<number>('activeTabId', { required: true })

const emit = defineEmits<{
  closeTab: [id: number]
}>()
</script>

<template>
  <Tabs :model-value="String(activeTabId)" @update:model-value="activeTabId = Number($event)">
    <TabsList>
      <TabsTrigger v-for="tab in tabs" :key="tab.id" :value="String(tab.id)" class="gap-1">
        {{ tab.label }}
        <button
          v-if="tabs.length > 1"
          class="rounded-sm opacity-60 hover:opacity-100"
          @click.stop="emit('closeTab', tab.id)"
        >
          <X class="h-3 w-3" />
        </button>
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>

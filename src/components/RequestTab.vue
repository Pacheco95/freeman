<script setup lang="ts">
import { computed } from 'vue'
import RequestForm, { type RequestFormData } from '@/components/RequestForm.vue'
import ObjTable from '@/components/ObjTable.vue'
import BodyEditor from '@/components/BodyEditor.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRequestStore } from '@/stores/request.store.ts'

type Obj = { key: string; value: string }

const props = defineProps<{ tabId: number }>()
defineEmits<{ submit: [data: RequestFormData] }>()

const requestStore = useRequestStore()
const tab = computed(() => requestStore.tabs.find((t) => t.id === props.tabId)!)

const columns = [
  { title: 'Key', field: 'key' },
  { title: 'Value', field: 'value' },
] as const as Array<{
  title: string
  field: keyof Obj
}>
</script>

<template>
  <div class="flex flex-col gap-4 flex-1">
    <RequestForm
      :method="tab.method"
      :url="tab.url"
      @update:method="tab.method = $event"
      @update:url="tab.url = $event"
      @submit="$emit('submit', $event)"
    />

    <Tabs
      class="flex-1 flex flex-col"
      :model-value="tab.panelTab"
      :unmount-on-hide="false"
      @update:model-value="tab.panelTab = $event as string"
    >
      <TabsList>
        <TabsTrigger value="params">Params</TabsTrigger>
        <TabsTrigger value="headers">Headers</TabsTrigger>
        <TabsTrigger value="body">Body</TabsTrigger>
      </TabsList>
      <TabsContent value="params">
        <ObjTable :columns="columns" v-model:rows="tab.params" />
      </TabsContent>
      <TabsContent value="headers">
        <ObjTable :columns="columns" v-model:rows="tab.headers" />
      </TabsContent>
      <TabsContent value="body" class="h-full flex flex-col">
        <BodyEditor :model-value="tab.body" @update:model-value="tab.body = $event" />
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RequestForm, { type RequestFormData } from '@/components/RequestForm.vue'
import ObjTable from '@/components/ObjTable.vue'
import BodyEditor from '@/components/BodyEditor.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRequestStore } from '@/stores/request.store.ts'
import type { BodyRawSyntax, BodyType } from '@/types/misc.ts'

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

const bodyTypes: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'none' },
  { value: 'form-data', label: 'form-data' },
  { value: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
  { value: 'raw', label: 'raw' },
]

const rawSyntaxOptions: BodyRawSyntax[] = ['JSON', 'Text', 'JavaScript', 'HTML', 'XML']

const syntaxToLanguage: Record<BodyRawSyntax, string> = {
  JSON: 'json',
  Text: 'plaintext',
  JavaScript: 'javascript',
  HTML: 'html',
  XML: 'xml',
}

const editorLanguage = computed(() => syntaxToLanguage[tab.value.bodyRawSyntax])
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
      <TabsContent value="body" class="h-full flex flex-col gap-3">
        <div class="flex items-center gap-4">
          <RadioGroup
            :model-value="tab.bodyType"
            class="flex flex-row gap-4 min-h-8"
            @update:model-value="tab.bodyType = $event as BodyType"
          >
            <div v-for="bt in bodyTypes" :key="bt.value" class="flex items-center space-x-2">
              <RadioGroupItem :id="`body-type-${bt.value}`" :value="bt.value" />
              <Label :for="`body-type-${bt.value}`">{{ bt.label }}</Label>
            </div>
          </RadioGroup>
          <Select
            v-if="tab.bodyType === 'raw'"
            :model-value="tab.bodyRawSyntax"
            @update:model-value="tab.bodyRawSyntax = $event as BodyRawSyntax"
          >
            <SelectTrigger class="w-36 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="syntax in rawSyntaxOptions" :key="syntax" :value="syntax">
                {{ syntax }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <template v-if="tab.bodyType === 'form-data' || tab.bodyType === 'x-www-form-urlencoded'">
          <ObjTable :columns="columns" v-model:rows="tab.bodyFormRows" />
        </template>
        <template v-else-if="tab.bodyType === 'raw'">
          <BodyEditor
            :model-value="tab.body"
            :language="editorLanguage"
            @update:model-value="tab.body = $event"
          />
        </template>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ObjTable from '@/components/ObjTable.vue'
import BodyEditor from '@/components/BodyEditor.vue'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BodyRawSyntax, BodyType, KeyValue, ParamRow } from '@/types/misc.ts'

const bodyType = defineModel<BodyType>('bodyType', { required: true })
const bodyRawSyntax = defineModel<BodyRawSyntax>('bodyRawSyntax', { required: true })
const body = defineModel<string>('body', { required: true })
const bodyFormRows = defineModel<ParamRow[]>('bodyFormRows', { required: true })

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

const editorLanguage = computed(() => syntaxToLanguage[bodyRawSyntax.value])

const columns = [
  { title: 'Key', field: 'key' },
  { title: 'Value', field: 'value' },
] as const as Array<{ title: string; field: keyof KeyValue }>
</script>

<template>
  <div class="h-full flex flex-col gap-3">
    <div class="flex items-center gap-4">
      <RadioGroup
        :model-value="bodyType"
        class="flex flex-row gap-4 min-h-8"
        @update:model-value="bodyType = $event as BodyType"
      >
        <div v-for="bt in bodyTypes" :key="bt.value" class="flex items-center space-x-2">
          <RadioGroupItem :id="`body-type-${bt.value}`" :value="bt.value" />
          <Label :for="`body-type-${bt.value}`">{{ bt.label }}</Label>
        </div>
      </RadioGroup>
      <Select
        v-if="bodyType === 'raw'"
        :model-value="bodyRawSyntax"
        @update:model-value="bodyRawSyntax = $event as BodyRawSyntax"
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

    <template v-if="bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded'">
      <ObjTable :columns="columns" v-model:rows="bodyFormRows" />
    </template>
    <template v-else-if="bodyType === 'raw'">
      <BodyEditor v-model="body" :language="editorLanguage" />
    </template>
  </div>
</template>

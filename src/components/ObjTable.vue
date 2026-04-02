<script setup lang="ts" generic="T extends Record<string, string>">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GripVertical, Trash2 } from 'lucide-vue-next'
import { nextTick, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

type Row = {
  data: T
  active: boolean
}

type Column<T> = {
  title: string
  field: keyof T & string
}

const { columns } = defineProps<{
  columns: Column<T>[]
}>()

const rows = defineModel<Row[]>('rows', { default: () => [] })

const draggedIndex = ref<number | null>(null)

function createEmptyData(): T {
  const d = {} as T
  columns.forEach((col) => {
    ;(d as Record<string, string>)[col.field] = ''
  })
  return d
}

// Remove trailing empty row left over from old persisted state
const last = rows.value[rows.value.length - 1]
if (last && !last.active && Object.values(last.data).every((v) => v === '')) {
  rows.value.splice(rows.value.length - 1, 1)
}

// Placeholder row lives in local state only — never written to the model.
// Typed as Record<string,string> (the constraint of T) to avoid ref<T> unwrapping issues.
const placeholderData = ref<Record<string, string>>(createEmptyData())
const placeholderKey = ref(0)
const activePlaceholderColIndex = ref(0)

const tableBodyRef = ref<ComponentPublicInstance | null>(null)

watch(
  placeholderData,
  async () => {
    if (Object.values(placeholderData.value).some((v) => v !== '')) {
      const colIndex = activePlaceholderColIndex.value
      rows.value.push({ data: { ...placeholderData.value } as T, active: true })
      placeholderData.value = createEmptyData()
      // Increment the key to force Vue to recreate the placeholder DOM elements,
      // which makes the browser respect the reset value on the focused input.
      placeholderKey.value++

      await nextTick()
      const tbody = tableBodyRef.value?.$el as HTMLElement | undefined
      const allRows = tbody?.querySelectorAll(':scope > tr')
      if (allRows && allRows.length >= 2) {
        // Second-to-last tr is the newly created real row (last is the placeholder)
        const newRow = allRows[allRows.length - 2]
        const inputs = newRow?.querySelectorAll('input')
        inputs?.[colIndex]?.focus()
      }
    }
  },
  { deep: true },
)

const removeRow = (index: number) => {
  rows.value.splice(index, 1)
}

const onDragStart = (event: DragEvent, index: number) => {
  draggedIndex.value = index
  event.dataTransfer!.effectAllowed = 'move'
}

const onDrop = (_event: DragEvent, dropIndex: number) => {
  if (draggedIndex.value !== null && draggedIndex.value !== dropIndex) {
    const draggedRow = rows.value.splice(draggedIndex.value, 1)[0] as Row
    rows.value.splice(dropIndex, 0, draggedRow)
  }
  draggedIndex.value = null
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="w-8"></TableHead>
        <TableHead v-for="column in columns" :key="column.title">{{ column.title }}</TableHead>
        <TableHead class="w-8"></TableHead>
      </TableRow>
    </TableHeader>
    <TableBody ref="tableBodyRef">
      <TableRow
        v-for="(row, index) in rows"
        :key="index"
        @dragover.prevent
        @drop="onDrop($event, index)"
      >
        <TableCell class="font-medium">
          <div class="flex">
            <span draggable="true" @dragstart="onDragStart($event, index)" class="cursor-move">
              <GripVertical class="h-4 w-4 mr-2" />
            </span>
            <Checkbox v-model="row.active" />
          </div>
        </TableCell>
        <TableCell v-for="column in columns" :key="column.title">
          <Input class="rounded-none border-none shadow-none" v-model="row.data[column.field]" />
        </TableCell>
        <TableCell class="w-8">
          <Button variant="ghost" size="sm" @click="removeRow(index)" class="cursor-pointer">
            <Trash2 class="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
      <!-- Placeholder row: local component state, never persisted to the model -->
      <TableRow :key="`placeholder-${placeholderKey}`">
        <TableCell class="font-medium">
          <div class="flex">
            <span class="invisible cursor-move">
              <GripVertical class="h-4 w-4 mr-2" />
            </span>
            <Checkbox :model-value="false" disabled />
          </div>
        </TableCell>
        <TableCell v-for="(column, colIdx) in columns" :key="column.title">
          <Input
            class="rounded-none border-none shadow-none"
            v-model="placeholderData[column.field]"
            @focus="activePlaceholderColIndex = colIdx"
          />
        </TableCell>
        <TableCell class="w-8"></TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

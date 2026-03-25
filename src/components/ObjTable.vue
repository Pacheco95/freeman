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
import { ref, watch } from 'vue'

type Row = {
  data: T
  active: boolean
}

type Column<T> = {
  title: string
  field: keyof T
}

const { columns } = defineProps<{
  columns: Column<T>[]
}>()

const rows = defineModel<Row[]>('rows', { default: () => [] })

const draggedIndex = ref<number | null>(null)

const addEmptyRow = () => {
  const newData = {} as T
  columns.forEach((col) => {
    newData[col.field] = '' as T[keyof T]
  })
  rows.value.push({ data: newData, active: false })
}

const isLastRowEmpty = () => {
  const last = rows.value[rows.value.length - 1]
  return last && Object.values(last.data).some((v) => v !== '')
}

if (rows.value.length === 0) {
  addEmptyRow()
}

if (rows.value.length > 0) {
  if (isLastRowEmpty()) {
    addEmptyRow()
  }
}

watch(
  rows,
  () => {
    if (isLastRowEmpty()) {
      addEmptyRow()
    }
  },
  { deep: true },
)

const removeRow = (index: number) => {
  if (index < rows.value.length - 1) {
    rows.value.splice(index, 1)
  }
}

const onDragStart = (event: DragEvent, index: number) => {
  if (index >= rows.value.length - 1) {
    return
  }
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
    <TableBody>
      <TableRow
        v-for="(row, index) in rows"
        :key="index"
        @dragover.prevent
        @drop="index < rows.length - 1 ? onDrop($event, index) : null"
      >
        <TableCell class="font-medium">
          <div class="flex">
            <span
              draggable="true"
              @dragstart="onDragStart($event, index)"
              :class="[index < rows.length - 1 ? 'visible' : 'invisible', 'cursor-move']"
            >
              <GripVertical class="h-4 w-4 mr-2" />
            </span>
            <Checkbox v-model="row.active" />
          </div>
        </TableCell>
        <TableCell v-for="column in columns" :key="column.title">
          <Input class="rounded-none border-none shadow-none" v-model="row.data[column.field]" />
        </TableCell>
        <TableCell class="w-8">
          <Button
            v-if="index < rows.length - 1"
            variant="ghost"
            size="sm"
            @click="removeRow(index)"
            class="cursor-pointer"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

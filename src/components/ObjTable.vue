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
import { Trash2, GripVertical } from 'lucide-vue-next'
import { ref } from 'vue'

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

const addRow = () => {
  const newData = {} as T
  columns.forEach((col) => {
    newData[col.field] = '' as T[keyof T]
  })
  rows.value.push({ data: newData, active: false })
}

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
  <Button @click="addRow">Add Row</Button>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="w-8"> </TableHead>
        <TableHead v-for="column in columns" :key="column.title">{{ column.title }}</TableHead>
        <TableHead class="w-8"></TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow
        v-for="(row, index) in rows"
        :key="index"
        @dragover.prevent
        @drop="onDrop($event, index)"
      >
        <TableCell class="font-medium">
          <span
            draggable="true"
            @dragstart="onDragStart($event, index)"
            class="cursor-move inline-flex items-center"
          >
            <GripVertical class="h-4 w-4 mr-2" />
          </span>
          <Checkbox v-model="row.active" />
        </TableCell>
        <TableCell v-for="column in columns" :key="column.title">
          <Input class="rounded-none border-none shadow-none" v-model="row.data[column.field]" />
        </TableCell>
        <TableCell class="w-8">
          <Button variant="ghost" size="sm" @click="removeRow(index)">
            <Trash2 class="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

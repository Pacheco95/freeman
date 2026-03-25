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

type Row = {
  data: T
  active: boolean
}

type Column<T> = {
  title: string
  field: keyof T
}

const { columns, rows } = defineProps<{
  columns: Column<T>[]
  rows: Row[]
}>()
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="w-8"> </TableHead>
        <TableHead v-for="column in columns" :key="column.title">{{ column.title }}</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="(row, index) in rows" :key="index">
        <TableCell class="font-medium">
          <Checkbox v-model="row.active" />
        </TableCell>
        <TableCell v-for="column in columns" :key="column.title">
          <Input class="rounded-none border-none shadow-none" v-model="row.data[column.field]" />
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

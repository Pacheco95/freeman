<script setup lang="ts">
import { ref } from 'vue'
import RequestForm, { type RequestFormData } from '@/components/RequestForm.vue'
import type { Method } from '@/components/MethodSelect.vue'
import ObjTable from '@/components/ObjTable.vue'

const method = ref<Method>('POST')
const url = ref('')

type Obj = { name: string; value: string }

const columns = ref<
  {
    title: string
    field: keyof Obj
  }[]
>([
  { title: 'Name', field: 'name' },
  { title: 'Value', field: 'value' },
])

const rows = ref<{ active: boolean; data: Obj }[]>([
  { active: true, data: { name: 'foo', value: 'bar' } },
  {
    active: false,
    data: { name: 'a', value: 'n' },
  },
])

const handleSubmit = (values: RequestFormData) => {
  console.log(values)
}
</script>

<template>
  <main>
    <RequestForm v-model:method="method" v-model:url="url" @submit="handleSubmit" />

    <ObjTable :columns="columns" v-model:rows="rows" />
  </main>
</template>

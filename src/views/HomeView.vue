<script setup lang="ts">
import { ref } from 'vue'
import RequestForm, { type RequestFormData } from '@/components/RequestForm.vue'
import type { Method } from '@/components/MethodSelect.vue'
import ObjTable from '@/components/ObjTable.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const method = ref<Method>('POST')
const url = ref('')

type Obj = { key: string; value: string }

const columns = ref<
  {
    title: string
    field: keyof Obj
  }[]
>([
  { title: 'Key', field: 'key' },
  { title: 'Value', field: 'value' },
])

const params = ref<{ active: boolean; data: Obj }[]>([
  { active: true, data: { key: 'foo', value: 'bar' } },
  {
    active: false,
    data: { key: 'a', value: 'n' },
  },
])

const headers = ref<{ active: boolean; data: Obj }[]>([
  { active: true, data: { key: 'Authorization', value: 'Bearer <token>' } },
  {
    active: true,
    data: { key: 'Content-Type', value: 'application/json' },
  },
])

const handleSubmit = (values: RequestFormData) => {
  console.log(values)
}
</script>

<template>
  <main class="p-4">
    <RequestForm v-model:method="method" v-model:url="url" @submit="handleSubmit" />

    <Tabs default-value="params" class="mt-4">
      <TabsList>
        <TabsTrigger value="params">Params</TabsTrigger>
        <TabsTrigger value="headers">Headers</TabsTrigger>
      </TabsList>
      <TabsContent value="params">
        <ObjTable :columns="columns" v-model:rows="params" />
      </TabsContent>
      <TabsContent value="headers">
        <ObjTable :columns="columns" v-model:rows="headers" />
      </TabsContent>
    </Tabs>
  </main>
</template>

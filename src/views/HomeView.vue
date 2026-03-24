<script setup lang="ts">
import { ref } from 'vue'
import RequestForm, { type RequestFormData } from '@/components/RequestForm.vue'
import type { Method } from '@/components/MethodSelect.vue'

const method = ref<Method>('POST')
const url = ref('')

const handleSubmit = (values: RequestFormData) => {
  console.log(values)
}
</script>

<template>
  <main>
    <RequestForm v-model:method="method" v-model:url="url" @submit="handleSubmit" />
  </main>
</template>

<script setup lang="ts">
import MethodSelect from '@/components/MethodSelect.vue'
import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Method } from '@/types/Request.ts'

export type RequestFormData = {
  method: Method
  url: string
}

const props = defineProps<RequestFormData>()

const emit = defineEmits<{
  'update:method': [value: Method]
  'update:url': [value: string]
  submit: [data: RequestFormData]
}>()

const method = computed({
  get: () => props.method,
  set: (value) => emit('update:method', value),
})

const url = computed({
  get: () => props.url,
  set: (value) => emit('update:url', value),
})

const handleSubmit = () => {
  emit('submit', { method: props.method, url: props.url })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <fieldset class="flex">
      <MethodSelect class="rounded-r-none border-r-0" v-model="method" />
      <Input
        name="requestUrl"
        v-model="url"
        class="rounded-l-none border-l-0 rounded-r-none border-r-0"
      />
      <Button name="submitRequestForm" class="rounded-l-none border-l-0">Submit</Button>
    </fieldset>
  </form>
</template>

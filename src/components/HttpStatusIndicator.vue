<script setup lang="ts">
import { computed } from 'vue'
import statusCode from '@/types/StatusCode.ts'

const props = defineProps<{
  status: number
}>()

const style = computed(() => {
  if (props.status >= 200 && props.status < 300) {
    return 'bg-green-600 text-green-200 border-green-300'
  } else if (props.status >= 400 && props.status < 500) {
    return 'bg-yellow-600 text-yellow-200 border-yellow-300'
  } else if (props.status >= 500) {
    return 'bg-red-600 text-red-200 border-red-300'
  } else {
    return 'bg-gray-600 text-gray-200 border-gray-300'
  }
})
</script>

<template>
  <div :class="style" class="rounded-sm border px-2 text-sm py-[0.2rem] align-middle">
    {{ status }}
    {{ statusCode[status as keyof typeof statusCode] }}
  </div>
</template>

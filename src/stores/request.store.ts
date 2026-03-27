import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Method } from '@/types/Request.ts'

type KeyValue = { key: string; value: string }

export const useRequestStore = defineStore(
  'request',
  () => {
    const method = ref<Method>('GET')
    const url = ref('')
    const body = ref('')
    const params = ref<{ active: boolean; data: KeyValue }[]>([])
    const headers = ref<{ active: boolean; data: KeyValue }[]>([])
    return { method, url, body, params, headers }
  },
  {
    persist: true,
  },
)

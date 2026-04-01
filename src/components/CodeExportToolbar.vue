<script setup lang="ts">
import { computed, ref } from 'vue'
import { Copy, Check, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import BodyEditor from '@/components/BodyEditor.vue'
import { useRequestStore } from '@/stores/request.store.ts'
import { generateCode, EXPORT_FORMATS } from '@/services/export.service.ts'
import type { ExportFormat } from '@/services/export.service.ts'

const LANGUAGE_MAP: Record<ExportFormat, string> = {
  curl: 'shell',
  'js-fetch': 'javascript',
  'node-axios': 'javascript',
  'python-requests': 'python',
  'java-okhttp': 'java',
  'php-curl': 'php',
  'csharp-httpclient': 'csharp',
}

defineEmits<{ close: [] }>()

const requestStore = useRequestStore()

const selectedFormat = ref<ExportFormat>('curl')
const copied = ref(false)

const code = computed(() => generateCode(requestStore.activeTab, selectedFormat.value))
const language = computed(() => LANGUAGE_MAP[selectedFormat.value])

async function copyCode() {
  await navigator.clipboard.writeText(code.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2 border-b flex-shrink-0">
      <span class="text-sm font-medium">Code Snippet</span>
      <Button variant="ghost" size="icon" class="h-7 w-7" @click="$emit('close')">
        <X class="h-3.5 w-3.5" />
      </Button>
    </div>

    <!-- Language select -->
    <div class="px-3 py-2 border-b shrink-0">
      <Select v-model="selectedFormat">
        <SelectTrigger class="w-full h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="fmt in EXPORT_FORMATS"
            :key="fmt.value"
            :value="fmt.value"
            class="text-xs"
          >
            {{ fmt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Code display -->
    <div class="flex-1 relative min-h-0 flex flex-col">
      <Button
        variant="ghost"
        size="icon"
        class="absolute top-2 right-2 z-10 h-7 w-7 opacity-70 hover:opacity-100"
        :title="copied ? 'Copied!' : 'Copy to clipboard'"
        @click="copyCode"
      >
        <Check v-if="copied" class="h-3.5 w-3.5" />
        <Copy v-else class="h-3.5 w-3.5" />
      </Button>
      <BodyEditor :model-value="code" read-only :language="language" />
    </div>
  </div>
</template>

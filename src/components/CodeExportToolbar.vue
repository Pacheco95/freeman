<script setup lang="ts">
import { computed, ref } from 'vue'
import { Code2, Copy, Check, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRequestStore } from '@/stores/request.store.ts'
import { generateCode, EXPORT_FORMATS } from '@/services/export.service.ts'
import type { ExportFormat } from '@/services/export.service.ts'

const requestStore = useRequestStore()

const isOpen = ref(false)
const selectedFormat = ref<ExportFormat>('curl')
const copied = ref(false)

const code = computed(() => generateCode(requestStore.activeTab, selectedFormat.value))

function toggle() {
  isOpen.value = !isOpen.value
}

async function copyCode() {
  await navigator.clipboard.writeText(code.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div class="flex h-full">
    <!-- Sliding panel -->
    <div
      class="overflow-hidden transition-all duration-200 ease-in-out"
      :style="{ width: isOpen ? '300px' : '0px' }"
    >
      <div class="w-[300px] h-full flex flex-col border-l">
        <!-- Header -->
        <div class="flex items-center justify-between px-3 py-2 border-b flex-shrink-0">
          <span class="text-sm font-medium">Code Snippet</span>
          <Button variant="ghost" size="icon" class="h-7 w-7" @click="isOpen = false">
            <X class="h-3.5 w-3.5" />
          </Button>
        </div>

        <!-- Language select -->
        <div class="px-3 py-2 border-b flex-shrink-0">
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
        <div class="flex-1 relative min-h-0 overflow-hidden flex flex-col">
          <Button
            variant="ghost"
            size="icon"
            class="absolute top-2 right-2 z-10 h-7 w-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            :title="copied ? 'Copied!' : 'Copy to clipboard'"
            @click="copyCode"
          >
            <Check v-if="copied" class="h-3.5 w-3.5" />
            <Copy v-else class="h-3.5 w-3.5" />
          </Button>
          <pre
            class="flex-1 overflow-auto p-3 text-xs font-mono bg-zinc-950 text-zinc-100 leading-relaxed"
            >{{ code }}</pre
          >
        </div>
      </div>
    </div>

    <!-- Toggle button strip -->
    <div class="flex flex-col items-center border-l px-1 pt-1">
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{ 'bg-accent': isOpen }"
        :title="isOpen ? 'Close code snippet' : 'Show code snippet'"
        @click="toggle"
      >
        <Code2 class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>

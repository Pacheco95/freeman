<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils.ts'
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
export type Method = (typeof methods)[number]
const method = defineModel<Method>()
const props = defineProps({
  class: { type: String, default: '' },
})
</script>

<template>
  <Select v-model="method">
    <SelectTrigger :class="cn('w-30', props.class)">
      <SelectValue placeholder="Select a method" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="method in methods" :value="method" :key="method">{{ method }} </SelectItem>
    </SelectContent>
  </Select>
</template>

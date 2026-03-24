<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
export type Method = (typeof methods)[number]
const method = defineModel<Method>()
</script>

<template>
  <Select v-model="method">
    <SelectTrigger class="w-30">
      <SelectValue placeholder="Select a method" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="method in methods" :value="method" :key="method">{{ method }} </SelectItem>
    </SelectContent>
  </Select>
</template>

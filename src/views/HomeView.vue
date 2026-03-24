<script setup lang="ts">
import MethodSelect, { type Method } from '@/components/MethodSelect.vue'
import { ref } from 'vue'

const method = ref<Method>('GET')
</script>

<template>
  <main>
    <MethodSelect v-model="method" />
  </main>
</template>

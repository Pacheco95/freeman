<script setup lang="ts">
import { useColorMode } from '@vueuse/core'

const mode = useColorMode()
mode.value = 'auto'
</script>

<template>
  <RouterView />
</template>

<style scoped></style>

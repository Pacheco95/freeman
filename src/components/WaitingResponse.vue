<script setup lang="ts">
import { FolderCode } from 'lucide-vue-next'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
</script>

<template>
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon" class="w-24 h-24">
        <FolderCode :style="{ width: '4rem', height: '4rem' }" />
      </EmptyMedia>
      <EmptyTitle>Waiting for request</EmptyTitle>
      <EmptyDescription> Submit a new request to get the response </EmptyDescription>
    </EmptyHeader>
  </Empty>
</template>

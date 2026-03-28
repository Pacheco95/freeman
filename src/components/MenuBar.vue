<script setup lang="ts">
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { useUIStore } from '@/stores/ui.store.ts'

const ui = useUIStore()
</script>

<template>
  <Menubar>
    <MenubarMenu>
      <MenubarTrigger>File</MenubarTrigger>
      <MenubarContent>
        <MenubarItem @select="ui.openImportModal"> Import </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
</template>

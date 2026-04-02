<script setup lang="ts">
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { useUIStore } from '@/stores/ui.store.ts'
import { useWorkspace } from '@/composables/useWorkspace.ts'
import { isTauriEnv } from '@/util.ts'

const ui = useUIStore()
const { save, load } = useWorkspace()
</script>

<template>
  <Menubar>
    <MenubarMenu>
      <MenubarTrigger>File</MenubarTrigger>
      <MenubarContent>
        <MenubarItem @select="ui.openImportModal"> Import </MenubarItem>
        <template v-if="isTauriEnv()">
          <MenubarSeparator />
          <MenubarItem @select="save"> Save Workspace </MenubarItem>
          <MenubarItem @select="load"> Open Workspace </MenubarItem>
        </template>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
</template>

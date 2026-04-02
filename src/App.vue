<script setup lang="ts">
import { useColorMode } from '@vueuse/core'
import { Menu, MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu'
import { onMounted } from 'vue'
import { useUIStore } from '@/stores/ui.store.ts'
import { useWorkspace } from '@/composables/useWorkspace.ts'
import { isTauriEnv } from '@/util.ts'

useColorMode()

const ui = useUIStore()
const { save, load } = useWorkspace()

onMounted(async () => {
  if (!isTauriEnv()) {
    return
  }

  const fileSubmenu = await Submenu.new({
    text: 'File',
    items: [
      await MenuItem.new({
        id: 'import',
        text: 'Import',
        action: () => {
          ui.openImportModal()
        },
      }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await MenuItem.new({
        id: 'save-workspace',
        text: 'Save Workspace',
        action: () => save(),
      }),
      await MenuItem.new({
        id: 'open-workspace',
        text: 'Open Workspace',
        action: () => load(),
      }),
    ],
  })

  const menu = await Menu.new({
    items: [fileSubmenu],
  })

  menu.setAsAppMenu().catch(console.error)
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>

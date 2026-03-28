<script setup lang="ts">
import { useColorMode } from '@vueuse/core'
import { Menu, MenuItem, Submenu } from '@tauri-apps/api/menu'
import { onMounted } from 'vue'
import { useUIStore } from '@/stores/ui.store.ts'
import { isTauriEnv } from '@/util.ts'

useColorMode()

const ui = useUIStore()

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

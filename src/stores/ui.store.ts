import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    importModalOpen: false,
  }),

  actions: {
    openImportModal() {
      this.importModalOpen = true
    },
    closeImportModal() {
      this.importModalOpen = false
    },
  },
})

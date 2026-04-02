import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    importModalOpen: false,
    createWorkspaceModalOpen: false,
  }),

  actions: {
    openImportModal() {
      this.importModalOpen = true
    },
    closeImportModal() {
      this.importModalOpen = false
    },
    openCreateWorkspaceModal() {
      this.createWorkspaceModalOpen = true
    },
    closeCreateWorkspaceModal() {
      this.createWorkspaceModalOpen = false
    },
    $reset() {
      this.importModalOpen = false
      this.createWorkspaceModalOpen = false
    },
  },
})

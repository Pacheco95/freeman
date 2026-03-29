<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ref } from 'vue'
import { parseCurl } from '@/services/curl.service.ts'
import type { Request } from '@/types/Request.ts'

const emit = defineEmits<{
  submit: [value: Request]
}>()
const open = defineModel<boolean>('open', { default: false })
const curl = ref('')

const importCurl = () => {
  const request = parseCurl(curl.value)
  emit('submit', request)
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Import cURL</DialogTitle>
        <DialogDescription> Paste your cURL command below to import it.</DialogDescription>
      </DialogHeader>
      <Textarea v-model="curl" class="font-mono max-h-80 md:max-h-160" />
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button :disabled="curl.trim().length === 0" @click="importCurl">Import</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

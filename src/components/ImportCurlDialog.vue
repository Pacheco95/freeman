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

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <Dialog v-model:open="open">
    <form>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import cURL</DialogTitle>
          <DialogDescription> Paste your cURL command below to import it. </DialogDescription>
        </DialogHeader>
        <Textarea class="font-mono max-h-80 md:max-h-160" />
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline"> Cancel </Button>
          </DialogClose>
          <Button type="submit"> Import </Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>
</template>

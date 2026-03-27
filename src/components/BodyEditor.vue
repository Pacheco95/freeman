<template>
  <vue-monaco-editor
    style="height: 100%"
    class="border border-slate-200"
    :value="modelValue"
    :options="editorOptions"
    language="json"
    @update:value="handleValueChange"
    @mount="handleMount"
  />
</template>

<script lang="ts" setup>
import { computed, shallowRef } from 'vue'
import type { editor as monacoEditor } from 'monaco-editor'
import { useColorMode } from '@vueuse/core'

interface Props {
  modelValue: string
  readOnly?: boolean
}

const mode = useColorMode()

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorOptions = computed(() => ({
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  theme: mode.value === 'dark' ? 'vs-dark' : 'vs-light',
  readOnly: props.readOnly,
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on' as const,
  wordWrap: 'on' as const,
}))

const editor = shallowRef<monacoEditor.IStandaloneCodeEditor>()

const handleMount = (editorInstance: monacoEditor.IStandaloneCodeEditor) => {
  editor.value = editorInstance
}

const handleValueChange = (value: string) => {
  emit('update:modelValue', value)
}
</script>

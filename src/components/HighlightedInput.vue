<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import { cn } from '@/lib/utils'
import { useRequestStore } from '@/stores/request.store.ts'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const store = useRequestStore()
const attrs = useAttrs()
// Everything except `class` is forwarded to the inner <input> (e.g. `name`, `type`, `disabled`)
const inputAttrs = computed(() => {
  const { class: _, ...rest } = attrs
  return rest
})

const inputRef = ref<HTMLInputElement>()
const mirrorRef = ref<HTMLSpanElement>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

// Keep the mirror's scroll position in sync with the input's horizontal scroll.
function syncScroll() {
  if (mirrorRef.value && inputRef.value) {
    mirrorRef.value.style.transform = `translateX(-${inputRef.value.scrollLeft}px)`
  }
}

const definedVars = computed(
  () => new Set((store.activeWorkspace?.variables ?? []).map((v) => v.key)),
)

const highlighted = computed(() => {
  const text = props.modelValue ?? ''
  // Escape HTML so user-typed content can never inject markup.
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(/\{\{([^}]*)\}\}/g, (_, inner: string) => {
    const resolved = definedVars.value.has(inner.trim())
    const cls = resolved
      ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
      : 'bg-red-500/15 text-red-600 dark:text-red-400'
    return `<mark class="${cls} rounded-sm not-italic">{{${inner}}}</mark>`
  })
})
</script>

<template>
  <!--
    Outer div acts as the visible "input box" (border, ring, rounded).
    class from the consumer is merged here so overrides like `border-none` work as expected.
  -->
  <div
    :class="
      cn(
        'relative border-input h-9 w-full min-w-0 rounded-md border bg-transparent shadow-xs transition-[color,box-shadow]',
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
        attrs.class as string,
      )
    "
  >
    <!-- Actual input: normal flow, fills container; text transparent so mirror shows through -->
    <input
      ref="inputRef"
      v-bind="inputAttrs"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      class="h-full w-full bg-transparent px-3 py-1 text-base md:text-sm text-transparent outline-none placeholder:text-muted-foreground [caret-color:hsl(var(--foreground))] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
      @input="onInput"
      @scroll="syncScroll"
    />

    <!-- Mirror: absolute overlay painted on top; pointer-events-none so clicks pass through -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-3 select-none"
    >
      <span ref="mirrorRef" class="whitespace-pre text-base md:text-sm" v-html="highlighted" />
    </div>
  </div>
</template>

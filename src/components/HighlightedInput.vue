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
const isFocused = ref(false)
const cursorOffset = ref(0)

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
  updateCursor()
}

// Keep the mirror's scroll position in sync with the input's horizontal scroll.
function syncScroll() {
  if (mirrorRef.value && inputRef.value) {
    mirrorRef.value.style.transform = `translateX(-${inputRef.value.scrollLeft}px)`
  }
}

function updateCursor() {
  cursorOffset.value = inputRef.value?.selectionStart ?? 0
}

function onFocus() {
  isFocused.value = true
  updateCursor()
}

function onBlur() {
  isFocused.value = false
}

const definedVars = computed(
  () => new Set((store.activeWorkspace?.variables ?? []).map((v) => v.key)),
)

// The cursor is a zero-layout-impact inline element whose ::after draws the blinking line.
const CURSOR_HTML = '<span class="hi-cursor" aria-hidden="true"></span>'

const highlighted = computed(() => {
  const text = props.modelValue ?? ''
  const cursor = isFocused.value ? cursorOffset.value : null

  // Collect {{...}} spans once so we can open/close <mark> tags as we iterate.
  const spans: { start: number; end: number; cls: string }[] = []
  const re = /\{\{([^}]*)\}\}/g
  let m
  while ((m = re.exec(text)) !== null) {
    const resolved = definedVars.value.has(m[1].trim())
    spans.push({
      start: m.index,
      end: m.index + m[0].length,
      cls: resolved
        ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
        : 'bg-red-500/15 text-red-600 dark:text-red-400',
    })
  }

  let result = ''
  let spanIdx = 0

  // Iterate over every character position plus one sentinel for the trailing cursor.
  for (let i = 0; i <= text.length; i++) {
    // Insert cursor *before* the character at position i.
    if (cursor === i) result += CURSOR_HTML
    if (i === text.length) break

    // Open <mark> when a highlighted span begins here.
    if (spanIdx < spans.length && spans[spanIdx]!.start === i) {
      result += `<mark class="${spans[spanIdx]!.cls} rounded-sm not-italic">`
    }

    // Emit the character, HTML-escaped.
    const ch = text[i]!
    result += ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch

    // Close <mark> when the span ends after this character.
    if (spanIdx < spans.length && spans[spanIdx]!.end === i + 1) {
      result += '</mark>'
      spanIdx++
    }
  }

  return result
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
      class="h-full w-full bg-transparent px-3 py-1 text-base md:text-sm text-transparent outline-none placeholder:text-muted-foreground [caret-color:transparent] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
      @input="onInput"
      @scroll="syncScroll"
      @focus="onFocus"
      @blur="onBlur"
      @keyup="updateCursor"
      @mouseup="updateCursor"
      @click="updateCursor"
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

<style scoped>
/*
  width: 1.5px draws the blinking line; margin-right: -1.5px pulls the next character
  back so the cursor takes no layout space and surrounding text never shifts.
  vertical-align: middle aligns to the midpoint of the x-height, which matches the
  visual center of the text regardless of line-height.
*/
:deep(.hi-cursor) {
  display: inline-block;
  width: 1.5px;
  height: 1.2em;
  background: currentColor;
  vertical-align: middle;
  margin-right: -1.5px;
  animation: hi-cursor-blink 1s step-end infinite;
}

/* @keyframes are always global — the unique name avoids collisions. */
@keyframes hi-cursor-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>

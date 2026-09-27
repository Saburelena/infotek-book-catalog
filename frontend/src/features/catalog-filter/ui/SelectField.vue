<template>
  <div class="ui-select" :class="{ open }">
    <button
      ref="triggerRef"
      class="ui-select-trigger"
      type="button"
      :aria-label="label"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-controls="listId"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span class="ui-select-value">{{ currentLabel }}</span>
    </button>

    <div v-show="open" class="ui-select-panel" role="presentation">
      <ul
        :id="listId"
        ref="listRef"
        class="ui-select-list"
        :class="{ 'is-scrolling': scrolling }"
        role="listbox"
        :aria-label="label"
        :aria-activedescendant="activeOptionId"
        tabindex="-1"
        @keydown="onListKeydown"
        @scroll.passive="onScroll"
      >
        <li
          v-for="(option, index) in options"
          :id="optionId(index)"
          :key="option.value"
          class="ui-select-option"
          role="option"
          :class="{ selected: isSelected(option.value), active: index === activeIndex }"
          :aria-selected="isSelected(option.value)"
          @click="choose(option.value)"
          @mouseenter="activeIndex = index"
        >
          {{ option.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch } from "vue";

export type SelectOption = { value: string; label: string };

const props = withDefaults(
  defineProps<{
    options?: SelectOption[];
    label: string;
  }>(),
  { options: () => [] },
);

const model = defineModel<string | number>({ required: true });
const open = ref(false);
const activeIndex = ref(0);
const scrolling = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const listRef = ref<HTMLUListElement | null>(null);
const listId = useId();
const prefix = useId();
let timer = 0;

const options = computed(() => props.options);
const currentLabel = computed(
  () => options.value.find((option) => isSelected(option.value))?.label || props.label || "Выберите",
);
const activeOptionId = computed(() => (open.value && options.value.length ? optionId(activeIndex.value) : undefined));

function optionId(index: number) {
  return `${prefix}-opt-${index}`;
}

function isSelected(value: string) {
  return String(model.value ?? "") === String(value);
}

function selectedIndex() {
  const index = options.value.findIndex((option) => isSelected(option.value));
  return index >= 0 ? index : 0;
}

function toggle() {
  if (open.value) close();
  else void show();
}

async function show() {
  open.value = true;
  activeIndex.value = selectedIndex();
  await nextTick();
  listRef.value?.focus();
  scrollActiveIntoView();
  reveal();
}

function close() {
  open.value = false;
  scrolling.value = false;
  window.clearTimeout(timer);
  triggerRef.value?.focus();
}

function choose(value: string) {
  model.value = value;
  close();
}

function move(delta: number) {
  const total = options.value.length;
  if (!total) return;
  activeIndex.value = (activeIndex.value + delta + total) % total;
  scrollActiveIntoView();
}

function scrollActiveIntoView() {
  const list = listRef.value;
  const option = list?.children[activeIndex.value] as HTMLElement | undefined;
  if (!list || !option) return;

  const top = option.offsetTop;
  const bottom = top + option.offsetHeight;
  if (top < list.scrollTop) list.scrollTop = top;
  else if (bottom > list.scrollTop + list.clientHeight) {
    list.scrollTop = bottom - list.clientHeight;
  }
}

function reveal() {
  scrolling.value = true;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    scrolling.value = false;
  }, 700);
}

function onScroll() {
  reveal();
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (["ArrowDown", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    void show();
  }
}

function onListKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    move(1);
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    move(-1);
    return;
  }
  if (event.key === "Home") {
    event.preventDefault();
    activeIndex.value = 0;
    scrollActiveIntoView();
    return;
  }
  if (event.key === "End") {
    event.preventDefault();
    activeIndex.value = Math.max(0, options.value.length - 1);
    scrollActiveIntoView();
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    const option = options.value[activeIndex.value];
    if (option) choose(option.value);
  }
}

function onPointerDown(event: PointerEvent) {
  const root = triggerRef.value?.closest(".ui-select");
  if (root && root.contains(event.target as Node)) return;
  if (open.value) close();
}

watch(
  () => props.options,
  () => {
    activeIndex.value = selectedIndex();
  },
);

onMounted(() => document.addEventListener("pointerdown", onPointerDown));
onUnmounted(() => {
  document.removeEventListener("pointerdown", onPointerDown);
  window.clearTimeout(timer);
});
</script>

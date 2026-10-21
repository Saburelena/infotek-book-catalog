<template>
  <div class="search-field" :class="{ open: showHistory }">
    <input
      :id="id"
      v-model="draft"
      name="phone"
      type="tel"
      inputmode="tel"
      :placeholder="placeholder"
      autocomplete="off"
      @blur="onBlur"
      @keydown="onKeydown"
      @focus="onFocus"
      @input="onInput"
    />

    <div v-if="showHistory && visibleHistory.length" class="search-history-panel" role="presentation">
      <ul
        ref="listRef"
        class="search-history-list"
        :class="{ 'is-scrolling': scrolling }"
        role="listbox"
        :aria-label="'История номеров'"
        tabindex="-1"
        @keydown="onListKeydown"
        @scroll.passive="onScroll"
      >
        <li
          v-for="(item, index) in visibleHistory"
          :key="item"
          class="search-history-item"
          :class="{ active: index === activeIndex }"
          role="option"
          :aria-selected="index === activeIndex"
          @click="selectHistory(item)"
          @mouseenter="activeIndex = index"
        >
          {{ item }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = withDefaults(defineProps<{ id: string; value: string; placeholder?: string; history: string[] }>(), {
  placeholder: "",
});

const emit = defineEmits<{
  "update:value": [value: string];
  blur: [event: FocusEvent];
  focus: [];
  keydown: [event: KeyboardEvent];
  select: [value: string];
}>();

const draft = ref(props.value);
const showHistory = ref(false);
const activeIndex = ref(0);
const scrolling = ref(false);
const listRef = ref<HTMLUListElement | null>(null);
const scrollTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const visibleHistory = computed(() => {
  return props.history.slice(0, 5);
});

function addHistory(phone: string) {
  if (!phone.trim()) return;
  try {
    const stored = localStorage.getItem("phone_history");
    const items: string[] = stored ? JSON.parse(stored) : [];
    const filtered = items.filter((item) => item !== phone.trim());
    filtered.unshift(phone.trim());
    const maxItems = 10;
    localStorage.setItem("phone_history", JSON.stringify(filtered.slice(0, maxItems)));
  } catch {
    // ignore storage errors
  }
}

function getHistory(): string[] {
  try {
    const stored = localStorage.getItem("phone_history");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function onBlur(event: FocusEvent) {
  const related = event.relatedTarget;
  if (related instanceof HTMLElement && related.closest(".search-history-panel")) return;
  setTimeout(() => {
    showHistory.value = false;
    scrolling.value = false;
    if (scrollTimer.value) {
      clearTimeout(scrollTimer.value);
      scrollTimer.value = null;
    }
  }, 150);
  emit("blur", event);
}

function onFocus() {
  const history = getHistory();
  if (history.length > 0) {
    showHistory.value = true;
    activeIndex.value = 0;
  }
  emit("focus");
}

function onInput() {
  const query = draft.value.trim();
  if (!query) {
    showHistory.value = false;
    return;
  }
  const history = getHistory();
  showHistory.value = history.length > 0;
}

function onKeydown(event: KeyboardEvent) {
  emit("keydown", event);
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!showHistory.value) {
      showHistory.value = true;
      activeIndex.value = 0;
    } else {
      move(1);
    }
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    if (showHistory.value) {
      move(-1);
    }
  } else if (event.key === "Enter") {
    event.preventDefault();
    const query = draft.value.trim();
    if (!query) return;
    if (showHistory.value && visibleHistory.value.length > 0) {
      const selected = visibleHistory.value[activeIndex.value];
      if (selected) {
        selectHistory(selected);
      } else {
        emit("select", query);
      }
    } else {
      emit("select", query);
    }
  } else if (event.key === "Escape") {
    event.preventDefault();
    showHistory.value = false;
  }
}

function onListKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    showHistory.value = false;
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
  if (event.key === "Enter") {
    event.preventDefault();
    const item = visibleHistory.value[activeIndex.value];
    if (item) selectHistory(item);
  }
}

function move(delta: number) {
  const total = visibleHistory.value.length;
  if (!total) return;
  activeIndex.value = (activeIndex.value + delta + total) % total;
  scrollActiveIntoView();
}

function scrollActiveIntoView() {
  const list = listRef.value;
  const option = list?.children[activeIndex.value];
  if (!list || !(option instanceof HTMLElement)) return;

  const top = option.offsetTop;
  const bottom = top + option.offsetHeight;
  if (top < list.scrollTop) list.scrollTop = top;
  else if (bottom > list.scrollTop + list.clientHeight) {
    list.scrollTop = bottom - list.clientHeight;
  }
}

function onScroll() {
  scrolling.value = true;
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value);
  }
  scrollTimer.value = setTimeout(() => {
    scrolling.value = false;
    scrollTimer.value = null;
  }, 700);
}

function selectHistory(item: string) {
  draft.value = item;
  emit("select", item);
  showHistory.value = false;
}

watch(
  () => props.value,
  (value) => {
    draft.value = value;
  },
);

watch(
  () => draft.value,
  (value) => {
    emit("update:value", value);
    if (value) {
      addHistory(value);
    }
  },
);
</script>

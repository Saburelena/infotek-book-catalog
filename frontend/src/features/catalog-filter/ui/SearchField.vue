<template>
  <div class="search-field" :class="{ open: showHistory }">
    <span class="sr-only">{{ ariaLabel || placeholder || "Поиск" }}</span>
    <input
      :id="inputId"
      v-model="draft"
      name="search"
      type="search"
      :placeholder="placeholder"
      :aria-label="ariaLabel || undefined"
      autocomplete="off"
      @blur="onBlur"
      @keydown="onKeydown"
      @input="onInput"
    />

    <div v-if="showHistory && visibleHistory.length" class="search-history-panel" role="presentation">
      <ul
        ref="listRef"
        class="search-history-list"
        :class="{ 'is-scrolling': scrolling }"
        role="listbox"
        :aria-label="'История поиска'"
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
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="highlightMatch(item)" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";

const props = withDefaults(defineProps<{ value: string; placeholder?: string; ariaLabel?: string }>(), {
  placeholder: "",
  ariaLabel: "",
});

const emit = defineEmits<{
  "update:value": [value: string];
  search: [value: string];
}>();

const draft = ref(props.value);
const inputId = useId();
const showHistory = ref(false);
const activeIndex = ref(0);
const scrolling = ref(false);
const listRef = ref<HTMLUListElement | null>(null);
const scrollTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const history = computed<string[]>(() => {
  try {
    const stored = localStorage.getItem("search_history");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
});

const hasMatch = computed(() => {
  const query = draft.value.trim().toLowerCase();
  if (!query) return history.value.length > 0;
  return history.value.some((item) => item.toLowerCase().includes(query));
});

const filteredHistory = computed(() => {
  const query = draft.value.trim().toLowerCase();
  if (!query) return history.value;

  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const item of history.value) {
    if (item.toLowerCase().includes(query)) {
      matched.push(item);
    } else {
      unmatched.push(item);
    }
  }

  return [...matched, ...unmatched];
});

const visibleHistory = computed(() => {
  return filteredHistory.value.slice(0, 5);
});

function highlightMatch(item: string): string {
  const query = draft.value.trim();
  if (!query) return escapeHtml(item);

  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  return escapeHtml(item).replace(regex, '<span class="search-match">$1</span>');
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function addHistory(query: string) {
  if (!query.trim()) return;
  try {
    const stored = localStorage.getItem("search_history");
    const items: string[] = stored ? JSON.parse(stored) : [];
    const filtered = items.filter((item) => item !== query.trim());
    filtered.unshift(query.trim());
    const maxItems = 50;
    localStorage.setItem("search_history", JSON.stringify(filtered.slice(0, maxItems)));
  } catch {
    // ignore storage errors
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
}

let isFirstChar = true;

function onInput() {
  const query = draft.value.trim();
  if (!query) {
    showHistory.value = false;
    isFirstChar = true;
    return;
  }
  if (isFirstChar && hasMatch.value) {
    showHistory.value = true;
    activeIndex.value = 0;
    isFirstChar = false;
  } else if (!hasMatch.value) {
    showHistory.value = false;
  }
}

function onKeydown(event: KeyboardEvent) {
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
    if (showHistory.value && filteredHistory.value.length > 0) {
      const selected = filteredHistory.value[activeIndex.value];
      if (selected) {
        selectHistory(selected);
      } else {
        emit("search", query);
      }
    } else {
      emit("search", query);
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
    const item = filteredHistory.value[activeIndex.value];
    if (item) selectHistory(item);
  }
}

function move(delta: number) {
  const total = filteredHistory.value.length;
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
  emit("search", item);
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

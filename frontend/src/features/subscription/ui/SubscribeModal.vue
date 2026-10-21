<template>
  <AppModal :labelled-by="titleId" :described-by="descId" :busy="pending" @close="emit('close')">
    <h2 :id="titleId">Подписка на автора</h2>
    <p :id="descId">
      SMS о новых книгах
      <strong class="person">{{ authorName }}</strong>
      придёт на указанный номер. Отправка идёт через SMSPilot (эмулятор, реальной SMS нет).
    </p>

    <form class="ui-stack" novalidate @submit.prevent="submit">
      <label :for="phoneId">
        Телефон
        <div class="search-field phone-search-field" :class="{ open: showPhoneHistory }">
          <input
            :id="phoneId"
            v-model="phone"
            :name="`subscribe_phone_${authorId}`"
            type="search"
            inputmode="tel"
            autocomplete="off"
            placeholder="79001112233"
            :aria-invalid="error ? true : undefined"
            @focus="onPhoneFocus"
            @blur="onPhoneBlur"
            @keydown="onPhoneKeydown"
            @input="onPhoneInput"
          />

          <div v-if="showPhoneHistory && visiblePhoneHistory.length" class="search-history-panel" role="presentation">
            <ul
              ref="phoneListRef"
              class="search-history-list"
              :class="{ 'is-scrolling': phoneScrolling }"
              role="listbox"
              aria-label="История номеров"
              tabindex="-1"
              @keydown="onPhoneListKeydown"
              @scroll.passive="onPhoneScroll"
            >
              <li
                v-for="(item, index) in visiblePhoneHistory"
                :key="item"
                class="search-history-item"
                :class="{ active: index === phoneActiveIndex }"
                role="option"
                :aria-selected="index === phoneActiveIndex"
                @click="selectPhoneHistory(item)"
                @mouseenter="phoneActiveIndex = index"
              >
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </label>
      <FieldError :id="errorId" :message="error" />

      <div class="ui-row">
        <button class="btn btn-primary" :disabled="pending" type="submit">
          {{ pending ? "Отправка…" : "Подписаться" }}
        </button>
        <button class="btn btn-ghost" :disabled="pending" type="button" @click="emit('close')">Отмена</button>
      </div>
    </form>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import AppModal from "@/shared/ui/AppModal.vue";
import FieldError from "@/shared/ui/FieldError.vue";
import { useSubscription } from "../model/useSubscription";

const props = defineProps<{ authorId: number; authorName: string }>();
const emit = defineEmits<{ close: [] }>();
const titleId = useId();
const descId = useId();
const errorId = useId();
const phoneId = useId();

const { phone, error, pending, submit } = useSubscription(props.authorId, () => emit("close"));

const showPhoneHistory = ref(false);
const phoneActiveIndex = ref(0);
const phoneScrolling = ref(false);
const phoneListRef = ref<HTMLUListElement | null>(null);
const phoneScrollTimer = ref<ReturnType<typeof setTimeout> | null>(null);

const phoneHistory = computed<string[]>(() => {
  try {
    const stored = localStorage.getItem("phone_history");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
});

const hasMatch = computed(() => {
  const query = phone.value.trim().toLowerCase();
  if (!query) return phoneHistory.value.length > 0;
  return phoneHistory.value.some((item) => item.toLowerCase().startsWith(query));
});

const filteredPhoneHistory = computed(() => {
  const query = phone.value.trim().toLowerCase();
  if (!query) return phoneHistory.value;

  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const item of phoneHistory.value) {
    const itemLower = item.toLowerCase();
    if (itemLower.startsWith(query)) {
      matched.push(item);
    } else {
      unmatched.push(item);
    }
  }

  return [...matched, ...unmatched];
});

const visiblePhoneHistory = computed(() => {
  return filteredPhoneHistory.value.slice(0, 1);
});

function addPhoneHistory(value: string) {
  if (!value.trim()) return;
  try {
    const stored = localStorage.getItem("phone_history");
    const items: string[] = stored ? JSON.parse(stored) : [];
    const filtered = items.filter((item) => item !== value.trim());
    filtered.unshift(value.trim());
    localStorage.setItem("phone_history", JSON.stringify(filtered.slice(0, 50)));
  } catch {
    // ignore
  }
}

function onPhoneFocus() {
  // Не открываем панель при фокусе, только при вводе первого символа
}

function onPhoneBlur() {
  setTimeout(() => {
    showPhoneHistory.value = false;
    phoneScrolling.value = false;
    if (phoneScrollTimer.value) {
      clearTimeout(phoneScrollTimer.value);
      phoneScrollTimer.value = null;
    }
  }, 150);
}

function onPhoneKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    showPhoneHistory.value = false;
    return;
  }

  // При вводе символа обновляем историю
  if (event.key.length === 1) {
    onPhoneInput();
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!showPhoneHistory.value) {
      showPhoneHistory.value = true;
      phoneActiveIndex.value = 0;
    } else {
      movePhone(1);
    }
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    if (showPhoneHistory.value) {
      movePhone(-1);
    }
  } else if (event.key === "Enter") {
    event.preventDefault();
    const query = phone.value.trim();
    if (!query) return;
    if (showPhoneHistory.value && visiblePhoneHistory.value.length > 0) {
      const selected = visiblePhoneHistory.value[phoneActiveIndex.value];
      if (selected) {
        selectPhoneHistory(selected);
      } else {
        submit();
      }
    } else {
      submit();
    }
  }
}

let isFirstChar = true;

function onPhoneInput() {
  const query = phone.value.trim();
  if (!query) {
    showPhoneHistory.value = false;
    isFirstChar = true;
    return;
  }
  if (isFirstChar && hasMatch.value) {
    showPhoneHistory.value = true;
    phoneActiveIndex.value = 0;
    isFirstChar = false;
  } else if (!hasMatch.value) {
    showPhoneHistory.value = false;
  }
}

function onPhoneListKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    showPhoneHistory.value = false;
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    movePhone(1);
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    movePhone(-1);
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    const item = visiblePhoneHistory.value[phoneActiveIndex.value];
    if (item) selectPhoneHistory(item);
  }
}

function movePhone(delta: number) {
  const total = visiblePhoneHistory.value.length;
  if (!total) return;
  phoneActiveIndex.value = (phoneActiveIndex.value + delta + total) % total;
  scrollPhoneActiveIntoView();
}

function scrollPhoneActiveIntoView() {
  const list = phoneListRef.value;
  const option = list?.children[phoneActiveIndex.value];
  if (!list || !(option instanceof HTMLElement)) return;

  const top = option.offsetTop;
  const bottom = top + option.offsetHeight;
  if (top < list.scrollTop) list.scrollTop = top;
  else if (bottom > list.scrollTop + list.clientHeight) {
    list.scrollTop = bottom - list.clientHeight;
  }
}

function onPhoneScroll() {
  phoneScrolling.value = true;
  if (phoneScrollTimer.value) {
    clearTimeout(phoneScrollTimer.value);
  }
  phoneScrollTimer.value = setTimeout(() => {
    phoneScrolling.value = false;
    phoneScrollTimer.value = null;
  }, 700);
}

function selectPhoneHistory(item: string) {
  phone.value = item;
  showPhoneHistory.value = false;
}

watch(
  () => phone.value,
  (value) => {
    if (value) {
      addPhoneHistory(value);
    }
  },
);
</script>

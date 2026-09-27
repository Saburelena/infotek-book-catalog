<template>
  <label class="search-field">
    <span class="sr-only">{{ ariaLabel || placeholder || "Поиск" }}</span>
    <input
      :id="inputId"
      v-model="draft"
      name="search"
      type="search"
      :placeholder="placeholder"
      :aria-label="ariaLabel || undefined"
    />
  </label>
</template>

<script setup lang="ts">
import { ref, useId, watch } from "vue";

const props = withDefaults(defineProps<{ value: string; placeholder?: string; ariaLabel?: string }>(), {
  placeholder: "",
  ariaLabel: "",
});

const draft = ref(props.value);
const inputId = useId();

watch(
  () => props.value,
  (value) => {
    draft.value = value;
  },
);
</script>

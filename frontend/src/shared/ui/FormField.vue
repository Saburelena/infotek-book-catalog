<template>
  <label>
    {{ label }}
    <slot :invalid="Boolean(error)" :describedby="error ? errorId : undefined" />
    <FieldError :id="errorId" :message="error" />
  </label>
</template>

<script setup lang="ts">
import { useId } from "vue";
import FieldError from "./FieldError.vue";

withDefaults(defineProps<{ label: string; error?: string }>(), { error: "" });
const errorId = useId();
</script>

<template>
  <slot />
</template>

<script setup lang="ts">
import { onErrorCaptured } from "vue";
import { provideAppServices, type AppServices } from "@/shared/di/container";

const props = defineProps<{ services: AppServices }>();

provideAppServices(props.services);

onErrorCaptured((error) => {
  props.services.toast.fromError(error, "Что-то пошло не так");
  return false;
});
</script>

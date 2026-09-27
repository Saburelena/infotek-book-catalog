<template>
  <ContainerProvider :services="services">
    <RouterView />
    <AppToasts />
  </ContainerProvider>
</template>

<script setup lang="ts">
import ContainerProvider from "./providers/ContainerProvider.vue";
import AppToasts from "@/shared/ui/AppToasts.vue";
import type { AppServices } from "@/shared/di/container";

const props = defineProps<{ services: AppServices }>();
const services = props.services;
</script>

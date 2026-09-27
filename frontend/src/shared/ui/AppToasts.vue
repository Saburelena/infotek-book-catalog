<template>
  <div class="app-toasts" aria-live="polite" aria-relevant="additions">
    <div
      v-for="item in items"
      :key="item.id"
      class="app-toast"
      :class="{
        'app-toast-ok': item.kind === TOAST_KIND.ok,
        'app-toast-err': item.kind === TOAST_KIND.err,
      }"
      :role="item.kind === TOAST_KIND.err ? 'alert' : 'status'"
    >
      {{ item.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppServices } from "@/shared/di/container";
import { TOAST_KIND } from "@/shared/config/constants";

const { toast } = useAppServices();
const items = toast.items;
</script>

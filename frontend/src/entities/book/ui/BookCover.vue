<template>
  <div v-if="!srcUrl" class="cover-empty" :class="$attrs.class" role="img" aria-label="Обложка не загружена">
    <span>
      Нет
      <br />
      обложки
    </span>
  </div>
  <img
    v-else
    v-bind="$attrs"
    :src="srcUrl"
    :alt="title"
    width="300"
    height="420"
    :loading="eager ? 'eager' : 'lazy'"
    decoding="async"
    :fetchpriority="eager ? 'high' : 'low'"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { mediaUrl } from "@/shared/lib/utils";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    src?: string;
    title: string;
    eager?: boolean;
  }>(),
  { src: "", eager: false },
);

const srcUrl = computed(() => mediaUrl(props.src));
</script>

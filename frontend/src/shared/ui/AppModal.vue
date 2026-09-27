<template>
  <Teleport to="body">
    <div class="app-modal-backdrop" role="presentation" @click="!busy && emit('close')">
      <section
        ref="panelRef"
        class="app-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="labelledBy"
        :aria-describedby="describedBy"
        tabindex="-1"
        @click.stop
      >
        <slot />
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const props = withDefaults(
  defineProps<{
    labelledBy: string;
    describedBy?: string;
    busy?: boolean;
  }>(),
  { describedBy: undefined, busy: false },
);

const emit = defineEmits<{ close: [] }>();
const panelRef = ref<HTMLElement | null>(null);
let previousFocus: HTMLElement | null = null;

function focusables() {
  if (!panelRef.value) return [];
  return Array.from(panelRef.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.getAttribute("aria-hidden") !== "true",
  );
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && !props.busy) {
    event.preventDefault();
    emit("close");
    return;
  }
  if (event.key !== "Tab") return;

  const nodes = focusables();
  if (!nodes.length) {
    event.preventDefault();
    panelRef.value?.focus();
    return;
  }

  const first = nodes[0]!;
  const last = nodes[nodes.length - 1]!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

onMounted(async () => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.addEventListener("keydown", onKeydown);
  await nextTick();
  (focusables()[0] || panelRef.value)?.focus();
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeydown);
  if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
});
</script>

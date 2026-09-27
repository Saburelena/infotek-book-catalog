<template>
  <AppModal :labelled-by="titleId" :described-by="textId" :busy="pending" @close="emit('close')">
    <h2 :id="titleId">{{ title }}</h2>
    <p :id="textId">{{ text }}</p>
    <div class="ui-row">
      <button class="btn btn-danger" :disabled="pending" type="button" @click="onConfirm">
        {{ pending ? "Удаление…" : "Удалить" }}
      </button>
      <button class="btn btn-ghost" :disabled="pending" type="button" @click="emit('close')">Отмена</button>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, useId } from "vue";
import AppModal from "@/shared/ui/AppModal.vue";
import { useAppServices } from "@/shared/di/container";

const props = defineProps<{
  title: string;
  text: string;
  confirm: () => Promise<void>;
}>();

const emit = defineEmits<{ close: [] }>();
const { toast } = useAppServices();
const titleId = useId();
const textId = useId();
const pending = ref(false);

async function onConfirm() {
  pending.value = true;
  try {
    await props.confirm();
  } catch (error) {
    toast.fromError(error);
  } finally {
    pending.value = false;
  }
}
</script>

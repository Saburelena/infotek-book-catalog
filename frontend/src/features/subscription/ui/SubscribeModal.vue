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
        <input
          :id="phoneId"
          v-model="phone"
          name="phone"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="79001112233"
          :aria-invalid="error ? true : undefined"
          :aria-describedby="error ? errorId : undefined"
        />
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
import { useId } from "vue";
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
</script>

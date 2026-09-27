<template>
  <FormPage title="Вход" narrow>
    <template #intro>
      <p class="muted">
        Для CRUD используйте демо-учётку
        <code>user</code>
        /
        <code>user123</code>
        . Гостю вход не нужен.
      </p>
    </template>

    <form class="card-form" novalidate @submit.prevent="onSubmit">
      <label :for="usernameId">
        Логин
        <input
          :id="usernameId"
          v-model="username"
          name="username"
          autocomplete="username"
          :aria-invalid="error ? true : undefined"
          :aria-describedby="error ? errorId : undefined"
        />
      </label>

      <label :for="passwordId">
        Пароль
        <input
          :id="passwordId"
          v-model="password"
          name="password"
          type="password"
          autocomplete="current-password"
          :aria-invalid="error ? true : undefined"
          :aria-describedby="error ? errorId : undefined"
        />
      </label>

      <FieldError :id="errorId" :message="error" />

      <button class="btn btn-primary" :disabled="pending" type="submit">
        {{ pending ? "Входим…" : "Войти" }}
      </button>
    </form>
  </FormPage>
</template>

<script setup lang="ts">
import { ref, useId } from "vue";
import { useRoute, useRouter } from "vue-router";

import { errorMessage, isAbortError } from "@/shared/api/errors";
import { useAuth } from "@/features/auth";
import { REDIRECT_QUERY } from "@/shared/config/constants";
import { safeRedirect } from "@/shared/lib/utils";
import FormPage from "@/shared/ui/FormPage.vue";
import FieldError from "@/shared/ui/FieldError.vue";

const { login } = useAuth();
const route = useRoute();
const router = useRouter();
const usernameId = useId();
const passwordId = useId();
const errorId = useId();
const username = ref("");
const password = ref("");
const error = ref("");
const pending = ref(false);

const redirectPath = () => safeRedirect(route.query[REDIRECT_QUERY]);

async function onSubmit() {
  if (!username.value.trim() || !password.value) {
    error.value = "Укажите логин и пароль";
    return;
  }

  pending.value = true;
  error.value = "";

  try {
    await login(username.value.trim(), password.value);
    await router.replace(redirectPath());
  } catch (requestError) {
    if (isAbortError(requestError)) return;
    error.value = errorMessage(requestError, "Не удалось войти");
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <FormPage :title="id ? 'Изменить автора' : 'Добавить автора'">
    <form class="card-form" novalidate @submit.prevent="submit">
      <FormField v-slot="{ invalid, describedby }" label="ФИО" :error="error">
        <input
          v-model="fullName"
          name="full_name"
          autocomplete="name"
          :maxlength="LIMIT.name"
          :aria-invalid="invalid || undefined"
          :aria-describedby="describedby"
        />
      </FormField>
      <FormActions :pending="isPending" @cancel="cancel" />
    </form>
  </FormPage>
</template>

<script setup lang="ts">
import FormPage from "@/shared/ui/FormPage.vue";
import FormField from "@/shared/ui/FormField.vue";
import FormActions from "@/shared/ui/FormActions.vue";
import { useAuthorEditor } from "../model/useAuthorEditor";

const props = defineProps<{ id: number | null; fullName: string }>();

const { fullName, error, isPending, submit, cancel, LIMIT } = useAuthorEditor(props.id, props.fullName);
</script>

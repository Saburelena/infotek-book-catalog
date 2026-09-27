<template>
  <SelectField v-model="model" :options="options" :label="label" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { yearSelectOptions } from "@/shared/lib/utils";
import SelectField from "./SelectField.vue";

const props = withDefaults(
  defineProps<{
    years?: number[];
    emptyLabel?: string;
    label?: string;
  }>(),
  { years: () => [], emptyLabel: undefined, label: "Год" },
);

const model = defineModel<string | number>({ required: true });
const options = computed(() => yearSelectOptions(props.years, props.emptyLabel));
</script>

import { defineAsyncComponent } from "vue";

export const ConfirmDialog = defineAsyncComponent(() => import("./ConfirmDialog.vue"));
export const SubscribeModal = defineAsyncComponent(() => import("./SubscribeModal.vue"));

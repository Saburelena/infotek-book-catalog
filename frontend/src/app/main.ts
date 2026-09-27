import { createApp } from "vue";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

import { QUERY_RETRY, QUERY_STALE_MS } from "@/shared/config/constants";
import App from "./App.vue";
import { createAppServices } from "./providers/createAppServices";
import { createAppRouter } from "./router";
import "./styles/index.css";

const services = createAppServices();
const { router } = createAppRouter(services.auth);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_RETRY,
      refetchOnWindowFocus: false,
      staleTime: QUERY_STALE_MS,
    },
  },
});

createApp(App, { services }).use(router).use(VueQueryPlugin, { queryClient }).mount("#app");

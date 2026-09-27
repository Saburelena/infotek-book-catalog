import type { InjectionKey } from "vue";
import type { AppServices } from "./container";

export const APP_SERVICES_TOKEN: InjectionKey<AppServices> = Symbol("infotek-app-services");

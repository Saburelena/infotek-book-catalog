import { globalIgnores } from "eslint/config";
import pluginVue from "eslint-plugin-vue";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import pluginVitest from "@vitest/eslint-plugin";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
  },
  globalIgnores(["**/dist/**", "**/coverage/**", "**/node_modules/**"]),
  pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,
  {
    ...pluginVitest.configs.recommended,
    files: ["src/**/*.test.ts"],
    rules: {
      ...pluginVitest.configs.recommended.rules,
      "vue/one-component-per-file": "off",
      "vue/no-use-v-if-with-v-for": "error",
      "vue/require-v-for-key": "error",
      "vue/no-v-html": "error",
      "vitest/expect-expect": ["error", { assertFunctionNames: ["expect", "expectTypeOf"] }],
    },
  },
  skipFormatting,
);

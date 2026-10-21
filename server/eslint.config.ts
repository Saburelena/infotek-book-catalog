import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import pluginVitest from "@vitest/eslint-plugin";

export default defineConfig(
  // Что линтим
  {
    files: ["**/*.ts"],
  },

  // Что игнорим
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "eslint.config.ts"],
  },

  // Базовые recommended-правила ESLint
  tseslint.configs.recommended,

  // Type-aware линтинг (строже) — только для production-кода
  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    ...cfg,
    files: ["**/*.ts"],
    ignores: ["tests/**", "eslint.config.ts"],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: {
        ...(cfg.languageOptions?.parserOptions ?? {}),
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  })),

  // Строгие правила — по образцу frontend
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  // Express routes — middleware передаётся как callback, this не используется
  {
    files: ["routes/**/*.ts"],
    rules: {
      "@typescript-eslint/unbound-method": "off",
    },
  },

  // Startup log — console.log допустим
  {
    files: ["index.ts"],
    rules: {
      "no-console": "off",
    },
  },

  // Тесты — Vitest правила + ослабленный type-aware
  {
    files: ["tests/**/*.test.ts"],
    ...pluginVitest.configs.recommended,
    rules: {
      ...pluginVitest.configs.recommended.rules,
      "vitest/no-import-node-test": "off",
      "vitest/expect-expect": ["error", { assertFunctionNames: ["expect", "expectTypeOf"] }],
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
);

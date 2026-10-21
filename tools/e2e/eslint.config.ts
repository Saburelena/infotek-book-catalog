import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  // Что линтим
  {
    files: ["**/*.ts"],
  },

  // Что игнорим
  {
    ignores: ["node_modules/**", "playwright-report/**", "test-results/**", "eslint.config.ts"],
  },

  // Базовые recommended-правила ESLint
  tseslint.configs.recommended,

  // Type-aware линтинг
  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    ...cfg,
    files: ["**/*.ts"],
    ignores: ["eslint.config.ts"],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: {
        ...(cfg.languageOptions?.parserOptions ?? {}),
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  })),

  // Строгие правила
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },

  // E2E-тесты: Playwright API — сложные типы, ослабляем unsafe-правила
  {
    files: ["tests/**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
    },
  },
);

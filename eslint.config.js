// eslint.config.js
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // Ignorados globales
  {
    name: "global-ignores",
    ignores: [
      "packages/**/*",
      "lib/**/*",
      "coverage/**/*",
      "node_modules/**/*",
      "*.config.js",
      "!eslint.config.js",
      "src/lib/prisma/**/*"
    ],
  },

  // JS base
  {
    name: "javascript-config",
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    ...js.configs.recommended, // incluye parserOptions/rules base de JS
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Estilo (compatible con Prettier)
      quotes: ["error", "single", { avoidEscape: true }],
      indent: ["error", "tab", { SwitchCase: 1 }],
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",

      // Calidad
      "no-console": "warn",
      "no-debugger": "error",
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Imports
      "import/no-unresolved": "off",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",
    },
  },

  // TypeScript
  {
    name: "typescript-config",
    files: ["**/*.ts", "**/*.mts", "**/*.cts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        // Activa reglas type-aware; usa tu tsconfig específico para ESLint
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: process.cwd(),
        sourceType: "module",
        ecmaVersion: "latest",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
    },
    rules: {
      // Reglas recomendadas de TypeScript
      ...tseslint.configs.recommended.rules,
      
      // Estilo: usa reglas nativas (las @typescript-eslint/indent & quotes están deprecadas)
      // Compatible con Prettier
      quotes: ["error", "single", { avoidEscape: true }],
      indent: ["error", "tab", { SwitchCase: 1 }],

      // TS specific
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", disallowTypeAnnotations: false },
      ],

      // Imports (TS resuelve mejor que import/no-unresolved)
      "import/no-unresolved": "off",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-duplicates": "error",

      // Calidad
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "no-console": "warn",
      "no-debugger": "error",
    },
  },

  // Tests (relaja reglas duras)
  {
    name: "test-files-config",
    files: ["**/*.test.ts", "**/*.spec.ts", "**/__tests__/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "no-console": "off",
    },
  },

  // Archivos de config
  {
    name: "config-files",
    files: ["*.config.js", "*.config.ts", "jest.config.js", "commitlint.config.js"],
    rules: {
      "no-console": "off",
    },
  },

  // Prettier compatibility (debe ir al final)
  {
    name: "prettier-compatibility",
    ...prettierConfig,
  },

  // Opciones del linter
  {
    name: "linter-options",
    linterOptions: {
      noInlineConfig: false,
      reportUnusedDisableDirectives: "error",
    },
  },
];

import js from "@eslint/js"
import eslintPluginQuery from "@tanstack/eslint-plugin-query"
import eslintPluginBetterTailwind from "eslint-plugin-better-tailwindcss"
import eslintConfigPrettier from "eslint-config-prettier"
import eslintPluginImport from "eslint-plugin-import"
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y"
import eslintPluginReact from "eslint-plugin-react"
import eslintPluginReactHooks from "eslint-plugin-react-hooks"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "*.config.*",
      "src/shared/ui",
      "commitlint.config.*",
      ".agents",
      ".claude",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      eslintPluginQuery.configs["flat/recommended"],
      eslintConfigPrettier,
    ],
    plugins: {
      import: eslintPluginImport,
      react: eslintPluginReact,
      "jsx-a11y": eslintPluginJsxA11y,
      "react-hooks": eslintPluginReactHooks,
      "@tanstack/query": eslintPluginQuery,
      "better-tailwindcss": eslintPluginBetterTailwind,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
          moduleDirectory: ["node_modules", "./"],
        },
      },
      "better-tailwindcss": {
        entryPoint: "src/shared/assets/global.css",
        attributes: ["class", "className"],
        callees: ["cn", "clsx", "cva", "tw", "twMerge"],
      },
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,

      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/shared/ui",
              message:
                "Import directly from component files instead. Example: import { Button } from '@/shared/ui/button'",
            },
            {
              name: "@/shared/ui/index",
              message:
                "Import directly from component files instead. Example: import { Button } from '@/shared/ui/button'",
            },
          ],
        },
      ],

      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-alert": "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-param-reassign": "error",
      "no-shadow": "error",
      "no-multi-spaces": "error",
      "no-loop-func": "error",
      "no-tabs": "error",
      "prefer-arrow-callback": "error",

      "react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],
      "react/react-in-jsx-scope": "off",
      "react/jsx-props-no-spreading": "warn",
      "react/function-component-definition": [
        "error",
        {
          namedComponents: "arrow-function",
          unnamedComponents: "arrow-function",
        },
      ],
      "react/require-default-props": "off",
      "react/button-has-type": "error",

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "interface", format: ["PascalCase"], prefix: ["I"] },
        { selector: "typeAlias", format: ["PascalCase"], prefix: ["T"] },
      ],

      "no-restricted-syntax": [
        "error",
        {
          selector: "TSEnumDeclaration",
          message:
            "No enum. Use an `as const` object in model/constants.ts + a derived `T*` union in model/types.ts (see the fsd:feature-sliced-design skill).",
        },
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/(^|\\s)space-[xy]-/]",
          message: "Use `gap-*` on the flex/grid container instead of `space-x/y-*`.",
        },
        {
          selector:
            "CallExpression[callee.name=/^(cn|cva|clsx|twMerge)$/] Literal[value=/(^|\\s)space-[xy]-/]",
          message: "Use `gap-*` on the flex/grid container instead of `space-x/y-*`.",
        },
      ],

      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/prefer-default-export": "off",
      "import/no-default-export": "off",
      "import/no-cycle": "error",

      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-is-valid": "error",

      ...eslintPluginBetterTailwind.configs["recommended"].rules,
      "better-tailwindcss/enforce-consistent-class-order": "off",
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
      "better-tailwindcss/no-unknown-classes": [
        "warn",
        {
          ignore: ["dark", "group", "peer", "container/.*"],
        },
      ],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.stories.{ts,tsx}"],
    rules: {
      "import/no-default-export": "off",
      "react/jsx-props-no-spreading": "off",
      "query/exhaustive-deps": "off",
      "no-console": "off",
    },
  }
)

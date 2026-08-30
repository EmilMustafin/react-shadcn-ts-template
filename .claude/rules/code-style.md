---
paths:
  - "src/**/*.{ts,tsx}"
---

# Code Style (src/)

Distilled from `CONVENTIONS.md`. Deep dives: `CONVENTIONS.md` (rules) + `EXAMPLES.md` (canonical code shapes).

## Machine-enforced — never hand-check, never hand-format

- Prettier runs automatically after every Edit/Write (PostToolUse hook) — write code, ignore formatting.
- ESLint: `I*` interface / `T*` type-alias prefixes, `enum` ban, `space-y/x-*` ban, shadcn barrel-import ban, import order, TanStack Query rules.
- PreToolUse hooks: FSD layer paths, kebab-case filenames, `@/shared/ui` direct imports.
- Never add `eslint-disable` to bypass these.

## FSD

- `app → pages → widgets → features → entities → shared`; import downward only, never sideways within a layer.
- Cross-layer imports via `@/`; relative only within the same module; external access through the module's `index.ts` barrel (exception: `@/shared/ui/[name]` direct).

## Model split (literal rule)

- A **value** goes in `model/constants.ts` (incl. the `as const` "enum" object); a **type** goes in `model/types.ts` (incl. the derived `T*` union via type-only import — not a circular dependency).
- Zod schemas in `model/schemas.ts`; never inline in components or `api/`.
- Domain/reusable interfaces, status/variant lookup maps, magic constants → `model/`, never inline in `ui/*.tsx` (a component's own one-off props interface may stay local).

## React 19 + Compiler

- No `useEffect` for derived state (compute in render) or event side effects (do in handler); effects sync external systems only.
- Memoize only when measurably needed AND deps are stable — the Compiler removes the reflex, not the responsibility.
- No nested loops / `find` inside `map` in render — use a lookup map. No `key={index}` on dynamic lists.

## Styling & UI

- Semantic tokens only (`bg-background`, `text-foreground`, …) — no raw hex/px where a token exists, no `dark:` overrides.
- `size-*` when width equals height. `className` on an exported component = layout positioning only.
- Forms: `Field`/`FieldGroup` (never legacy `Form`/`FormField`); RHF + `zodResolver`, always `defaultValues`, keep `z.input === z.output`.
- Every visible string via `t()`; keys live in `src/shared/config/i18n/locales/en/translation.json`.

## Verification

`pnpm typecheck` only. Never `pnpm build` / `pnpm lint` / `pnpm stylelint` — Husky + CI own those.

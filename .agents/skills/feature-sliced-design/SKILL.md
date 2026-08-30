---
name: feature-sliced-design
description: Repo-specific Feature-Sliced Design rules — layers, module anatomy, import direction, model split. Use when creating modules, deciding which FSD layer code belongs to, or resolving import-boundary questions.
user-invocable: false
version: 0.2.0
---

# Feature-Sliced Design — repo quick reference

How FSD works **in this repo** (Vite + React Router SPA — standard `pages` layer, NOT the `views` layer some generic guides use). Full rules: `CONVENTIONS.md § Architecture`; canonical layouts: `examples/fsd-module-anatomy.md`. Generic methodology on demand: [REFERENCE.md](REFERENCE.md) (Next.js-oriented — repo rules win on conflict).

## Layers

```
app → pages → widgets → features → entities → shared
```

- Import **downward only**. Never upward, never sideways within a layer (a feature must not import another feature; an entity must not import another entity).
- Cross-layer imports via `@/`; relative imports only within the same module; external code enters a module only through its `index.ts` barrel (exception: `@/shared/ui/[name]` is imported by direct path).

## Which layer?

- **entity** — a domain resource (read-side): `api/[name].api.ts` + `api/[name].queries.ts`, `model/`, `index.ts`. No `ui/` mutations.
- **feature** — a user action (write-side): `api/[name].api.ts` + `api/[name].mutations.ts`, `hooks/`, `model/`, optional `ui/`, `index.ts`.
- **widget** — a composite reusable block: `ui/` (or `components/`), optional `config/` + `model/`, `index.ts`.
- **page** — one route-level file: `[name]-page.tsx`. Composes widgets/features; no business logic.
- **shared** — infrastructure only (http, react-query, storage, config, shadcn `ui/`). Nothing domain-specific.

## Module anatomy (identical skeleton per module)

```
[module]/
├── api/         # HTTP calls + query/mutation hooks
├── hooks/       # use-*.ts composed from api/model
├── model/       # types.ts, constants.ts, schemas.ts — domain only
├── ui/          # React components (optional)
└── index.ts     # public barrel — the only import surface
```

Model split is literal: a **value** → `constants.ts` (incl. `as const` "enum" objects), a **type** → `types.ts` (incl. derived `T*` unions via type-only import — not a cycle). Schemas → `schemas.ts`.

## Naming

Files/folders `kebab-case`; suffixes `.api.ts` / `.queries.ts` / `.mutations.ts`; pages `[name]-page.tsx`. (Enforced by hooks + ESLint — don't hand-check.)

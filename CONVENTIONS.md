# CONVENTIONS.md

Shared project conventions. Referenced by both `CLAUDE.md` and `AGENTS.md`.

> For concrete code examples (entity, feature, queries, mutations, schemas, compound components, extending shadcn components, etc.) see [`EXAMPLES.md`](./EXAMPLES.md).

## Project Overview

React TypeScript template with Feature-Sliced Design (FSD) architecture. Uses Vite, React 19, TanStack Query, shadcn/ui, Tailwind CSS v4, i18next.

## Token Discipline for AI Agents

To avoid burning tokens unnecessarily:

- **Do NOT run `pnpm build`** as a verification step. The pre-commit hook (Husky) already runs lint-staged + stylelint, and CI runs the full build. A local build call produces hundreds of lines of bundler output that adds nothing for an agent.
- **Do NOT run `pnpm lint` / `pnpm stylelint`** to "check the code". They are already wired into `lint-staged` on pre-commit. If you need to verify a specific rule, read the rule rather than scan the whole project.
- **Prefer `pnpm typecheck`** (`tsc --noEmit`) when you need explicit type validation — it is the smallest signal-per-token command.
- Trust the hooks. They run automatically on commit; agents should not pre-run them.

## Commands

- `pnpm dev` — dev server
- `pnpm build` — typecheck + production build (CI / humans only — agents skip)
- `pnpm lint` / `pnpm lint:fix` — ESLint (runs automatically on commit)
- `pnpm stylelint` / `pnpm stylelint:fix` — CSS/SCSS lint (runs automatically on commit)
- `pnpm format` — Prettier
- `pnpm typecheck` — `tsc --noEmit` (preferred verification command for agents)

## Architecture (Feature-Sliced Design)

FSD organizes the codebase by **business purpose**, not by technical type. Modules sit on layers; higher layers depend on lower layers, never the other way around.

### Layer Dependency Rule

```
app → pages → widgets → features → entities → shared
```

Higher layers import from lower layers only. Never import upward. Never import sideways within the same layer (a feature must not import another feature; an entity must not import another entity).

### Layer Structure

```
src/
├── app/              # Providers, routes, entry point
├── pages/            # Route-level components
├── widgets/          # Complex reusable UI blocks (layouts, sidebars)
├── features/         # User interaction scenarios (auth, forms)
├── entities/         # Business domain models (user, product)
└── shared/           # Reusable infrastructure
    ├── assets/       # global.css, static files
    ├── components/   # App-level shared components (page-loader)
    ├── config/       # env, i18n, routes
    ├── hooks/        # Shared hooks (use-mobile)
    ├── lib/          # Utilities, http client, react-query, storage
    ├── types/        # Global types (api.types)
    └── ui/           # shadcn/ui components (55+ components)
```

### Module Structure Patterns

**Feature** (`src/features/[name]/`):

```
api/          # API calls (.api.ts) and mutations (.mutations.ts)
hooks/        # Feature hooks (use-*.ts)
model/        # Types, business logic, validation schemas
ui/           # Feature UI components (optional)
index.ts      # Public API (barrel export)
```

**Entity** (`src/entities/[name]/`):

```
api/          # Entity API (.api.ts) and queries (.queries.ts)
model/        # Types, constants, validation schemas
index.ts      # Public API
```

**Widget** (`src/widgets/[name]/`):

```
components/   # or ui/ — sub-components
config/       # Configuration
model/        # Types
index.ts      # Public API (if needed)
```

**Page** (`src/pages/[name]/`):

```
[name]-page.tsx   # Page component
```

## Path Aliases

| Alias | Path       |
| ----- | ---------- |
| `@/*` | `src/*`    |
| `~/*` | `public/*` |

Configured in `tsconfig.paths.json` and `vite.config.ts`.

## Code Conventions

### Naming

- Files and folders: `kebab-case`
- Components: `PascalCase`
- Hooks: `use-` prefix in filename, `use` prefix in function name
- API files: `[name].api.ts`, `[name].queries.ts`, `[name].mutations.ts`
- Types files: `types.ts`
- Constants: `constants.ts`
- Schemas: `schemas.ts` (or `[name].schema.ts` for a single dominant schema)

### Type Identifiers

- **Interfaces** use the `I` prefix — `I[Entity]`, `I[Feature]Payload`, `I[Widget]Props`.
- **Types** (aliases, unions, `z.infer<...>`, mapped/utility derivations) use the `T` prefix — `T[Entity]Status`, `T[Feature]FormValues`, `TQueryKey`.
- The `T` prefix also applies to the type derived from an `as const` object — the value keeps its plain name (e.g. `[Entity]Status`), the derived union becomes `T[Entity]Status`. The `as const` object is a runtime value → it lives in `model/constants.ts`; the derived `T*` union lives in `model/types.ts` (see File Separation Rules).
- Generic parameters keep the standard short form (`T`, `K`, `V`, `TData`, `TError`) — no extra prefix.
- Component props: prefer `interface IFooProps` over `type TFooProps` unless you actually need a union/intersection.

→ See [`EXAMPLES.md`](./EXAMPLES.md) — every snippet uses these prefixes.

### Formatting (Prettier)

- No semicolons
- Double quotes
- Trailing commas: `es5`
- Line width: 100
- Tailwind class sorting enabled

### Imports

- Always use `@/` alias for imports between layers
- Relative imports only within the same module
- Import from barrel `index.ts` when importing from another module

### Barrel Exports

Every module must have `index.ts` that re-exports its public API. External code imports only through barrel files. Does NOT apply to `shared/ui/` — import shadcn components directly by file path (`@/shared/ui/button`).

## File Separation Rules

### API files (`api/`)

Contain only HTTP calls and query/mutation definitions. Types and constants must **not** live in `api/`.

- `[name].api.ts` — object with API methods (`httpClient.get(...).json<Type>()`)
- `[name].queries.ts` — `queryOptions` + query key factory (for entities)
- `[name].mutations.ts` — `useMutation` hooks (for features)

### Model files (`model/`)

Contain types, interfaces, const-object "enums", constants, zod schemas. Everything that describes the domain. The split is literal — **a value goes in `constants.ts`, a type goes in `types.ts`**:

- `types.ts` — interfaces, types, and **derived unions** (including the `T*` union derived from an `as const` object)
- `constants.ts` — entity name, query key segments, other constants, and **the `as const` "enum" object itself** (`[Entity]Status`) — it's a runtime value, not a type
- `schemas.ts` — zod validation schemas (when needed)

The `T*` union in `types.ts` derives from the `as const` value in `constants.ts` (`import type { [Entity]Status } from "./constants"`). This type-only import is erased at compile time — there is **no runtime cycle**, even if `constants.ts` imports the `T*` type back for an annotation. Do not treat it as a circular-dependency smell.

**Rule for closed string sets:** do NOT use TypeScript `enum`. Use a `const` object + a type derived via `(typeof X)[keyof typeof X]`. Reasons: no runtime class, tree-shakes cleanly, plays well with JSON, and the type is structurally the union of literal values. → See [`EXAMPLES.md` → Typing & File Splitting](./EXAMPLES.md#typing--file-splitting).

**Rule for validation schemas:** any form / payload validation belongs in `model/schemas.ts`. Do NOT inline zod schemas inside components or API files. Derive types via `z.infer<typeof schema>` and re-export them from `types.ts` only if the inferred type is used outside the schema file.

### Import Rules Within a Module

- `api/` imports types from `../model/types` (relative, within module)
- `api/` imports constants from own entity via `@/entities/[name]/model/constants`
- `api/` imports shared utils via `@/shared/lib`
- External code imports only from `index.ts` barrel

## Component Patterns

### Compound Component Pattern

When a component has 2+ tightly related sub-components, use the Compound Component Pattern — export an object with `.Root` and named sub-components.

Rules:

- Apply when a component has 2+ tightly related sub-components
- Always expose `.Root` as the wrapper component
- Export as a plain object with named sub-components
- Internal sub-components (not exposed via compound) stay in separate files within the module
- Does NOT apply to `shared/ui/` — those are managed by shadcn

→ See [`EXAMPLES.md` → Compound Component Pattern](./EXAMPLES.md#compound-component-pattern).

### Extending Base Components (shadcn wrappers)

When you wrap or extend an existing component (e.g. a styled `Button`, an `Input` with an icon, a domain-specific `Card`), **inherit the base component's props instead of redeclaring them**.

Rules:

- Extend the base component's prop type (`ComponentProps<typeof Button>` or the exported `ButtonProps`) and add only the new fields on top.
- Forward `...rest` to the base component so HTML attributes (`disabled`, `aria-*`, `data-*`, `onClick`, etc.) keep working without manual plumbing.
- Never duplicate variant props — re-export the base variants if a consumer needs them.
- Place wrappers next to the consumer: domain wrappers go inside the relevant feature/entity/widget, not in `shared/ui/`.

→ See [`EXAMPLES.md` → Extending Base Components](./EXAMPLES.md#extending-base-components).

### Typing — File Splitting

Keep `model/types.ts` as the single source of domain types per module. When the file grows large, split by concern (`types/user.ts`, `types/role.ts`) inside a `types/` folder and re-export from `model/index.ts` of the module. Do NOT scatter `*.types.ts` files across `api/`, `ui/`, or `hooks/` — those should import from `../model/types`.

→ See [`EXAMPLES.md` → Typing & File Splitting](./EXAMPLES.md#typing--file-splitting).

## Performance & Code Simplicity

Write code that's right the first time — review can't catch what wasn't written.

- **Algorithm before optimization.** Fix the data shape or the algorithm before reaching for a cache. No nested loops, no `find` inside `map`, prefer lookup maps over repeated scans.
- **Memoize only when measurably needed.** React Compiler removes the need for reflexive `useMemo`/`useCallback`/`memo` — it does NOT remove the responsibility. If deps change every render, the cache is dead weight; drop it.
- **No `useEffect` for derived state.** Compute it during render. Event-driven side effects go in the handler, not in an effect that watches state. Effects are for syncing with external systems only.
- **Split early.** Extract a helper or sub-component when logic is reuse or branches

## Key Patterns

### HTTP Client

Built on `ky` (`src/shared/lib/http/client.ts`):

- Base URL from `VITE_API_URL` env
- Auto-attaches Bearer token from `tokenStorage`
- 30s timeout, no retry

### TanStack Query

Config in `src/shared/lib/react-query/client.ts`:

- staleTime: 5 min, gcTime: 30 min
- No refetch on window focus
- No retry on 4xx errors
- Global error handlers for 401 → auto token refresh

### Query Key Factory

Use `createQueryKeyFactory` from `@/shared/lib/react-query` for type-safe query keys. Keys are defined in `[entity].queries.ts`, constants for key segments live in `model/constants.ts`.

→ See [`EXAMPLES.md` → Query Key Factory & TanStack Query](./EXAMPLES.md#query-key-factory--tanstack-query).

### Authentication

- Token storage: `localStorage` via `src/shared/lib/storage/token-storage.ts`
- Auto refresh on 401 via React Query global error handlers (`src/shared/lib/react-query/error-handlers.ts`)
- Race condition protection: multiple 401s share single refresh promise
- Auth feature: `src/features/auth/` (login, register, logout mutations + useAuth, useRequireAuth hooks)
- Protected routes: `src/app/routes/protected-route.tsx`
- Auth API uses direct `ky` (not `httpClient`) because login/register don't need auth headers

### Routing

- React Router v7 (`react-router`)
- Route paths defined in `src/shared/config/routes/paths.ts`
- Lazy loading pages with `React.lazy`

### i18n (Translations)

- `react-i18next` configured in `src/shared/config/i18n/index.ts`
- Locale files: `src/shared/config/i18n/locales/[lang]/translation.json`
- Currently only English (`en`)
- Translations organized by namespace sections: `common`, `navigation`, `errorBoundary`, `home`, etc.
- Use `useTranslation()` hook in components, keys like `t("common.save")`, `t("home.welcome.title")`
- When adding new pages/features — add corresponding translation keys to `translation.json`
- When adding a new language — create `src/shared/config/i18n/locales/[lang]/translation.json` and register in `src/shared/config/i18n/index.ts`

### Theming

- `next-themes` for dark/light mode
- CSS variables via Tailwind CSS v4
- shadcn/ui style: `new-york`, base color: `neutral`

## shadcn/ui

Config: `components.json`. Components installed to `src/shared/ui/`. Hooks to `src/shared/hooks/`. Utils to `src/shared/lib/`.

## Git Hooks (Husky)

- **pre-commit**: `pnpm lint:staged` + `pnpm stylelint`
- **commit-msg**: commitlint (conventional commits)
- **lint-staged**: ESLint fix on `*.{ts,tsx}`, Prettier on `*.{json,js,ts,jsx,tsx,html}`

## Commit Convention

Follow [Conventional Commits](https://conventionalcommits.org/):

```
feat: add user profile page
fix: resolve token refresh race condition
refactor: simplify auth logic
chore: update dependencies
docs: update README
```

## Environment Variables

Validated via Zod in `src/shared/config/env/schema.ts`:

```
MODE=development
VITE_APP_NAME=React App
VITE_API_URL=https://api.example.com
VITE_ENABLE_DEVTOOLS=false
```

## Build

- Vite 8 with React compiler (babel-plugin-react-compiler)
- Manual chunks for bundle splitting (React, Radix UI, form libs, icons)
- `rollup-plugin-visualizer` → `stats.html` after build

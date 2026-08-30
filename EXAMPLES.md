# EXAMPLES.md

Concrete reference code for every convention in [`CONVENTIONS.md`](./CONVENTIONS.md).

> Read [`CONVENTIONS.md`](./CONVENTIONS.md) first. This file is only the "what does it look like in code" companion.

**Placeholders.** Every example uses abstract placeholders, never a real module from this repo (the scaffolded `src/` modules are template examples and may be deleted). Substitute your own names:
`[entity]` / `[feature]` / `[widget]` — the kebab-case module name · `[Entity]` — its PascalCase form · `I[Entity]`, `T[Entity]Status` — its types · `[ENTITY]_ENTITY`, `[ENTITY]_QUERY_KEYS` — its constants · `[entity]Api`, `[entity]Keys`, `[entity]Queries` — its api surface. Real infrastructure under `shared/` (`httpClient`, `createQueryKeyFactory`, `env`, shadcn primitives in `shared/ui/`) is referenced by its real name — it's the foundation layer, always present.

## Table of Contents

- [FSD — Module Anatomy](#fsd--module-anatomy)
- [Entity Example](#entity-example)
- [Feature Example](#feature-example)
- [Query Key Factory & TanStack Query](#query-key-factory--tanstack-query)
- [Mutations & Cache Invalidation](#mutations--cache-invalidation)
- [Typing & File Splitting](#typing--file-splitting)
- [Validation Schemas (`schemas.ts`)](#validation-schemas-schemasts)
- [Compound Component Pattern](#compound-component-pattern)
- [Extending Base Components](#extending-base-components)
- [Barrel Exports](#barrel-exports)

---

## FSD — Module Anatomy

A **module** is a self-contained piece of business logic on one of the FSD layers (`entities`, `features`, `widgets`, `pages`). Every module has the same skeleton:

```
[module]/
├── api/         # HTTP calls + query/mutation hooks
├── hooks/       # use-*.ts hooks composed from api/model
├── model/       # types.ts, constants.ts, schemas.ts (domain only)
├── ui/          # React components (optional)
└── index.ts     # public barrel — only file outside code may import
```

Layer-specific differences:

- **Entity** has `api/[name].queries.ts` (read-side) — no mutations.
- **Feature** has `api/[name].mutations.ts` (write-side) — no queryOptions.
- **Widget** usually has only `ui/` + `model/` + `config/`.
- **Page** is just one component file.

Layer dependency direction (a higher layer may import a lower one, never the reverse):

```
app → pages → widgets → features → entities → shared
```

---

## Entity Example

An entity models a domain resource: its types, constants, base HTTP calls, read-side queries, and presentational UI.

### `model/constants.ts`

A closed set of string literals (roles, statuses, kinds) is modeled with an **`as const` object + derived type** instead of a TypeScript `enum` — no runtime class, tree-shakes cleanly, plays well with JSON, and the type is structurally the union of literal values.

The `as const` object is a **runtime value**, so it lives in `constants.ts` alongside the other constants:

```typescript
// src/entities/[entity]/model/constants.ts
export const [ENTITY]_ENTITY = "[entity]" as const

export const [ENTITY]_QUERY_KEYS = {
  LIST: "list",
} as const

// The `as const` "enum" — a value → constants.ts.
export const [Entity]Status = {
  Active: "active",
  Archived: "archived",
} as const
```

### `model/types.ts`

The **derived union is a type**, so it lives in `types.ts`. It derives from the `as const` value via a type-only import — this is erased at compile time, so there is no runtime cycle:

```typescript
// src/entities/[entity]/model/types.ts
import type { [Entity]Status } from "./constants"

export type T[Entity]Status = (typeof [Entity]Status)[keyof typeof [Entity]Status]
// → "active" | "archived"

export interface I[Entity] {
  id: string
  name: string
  status: T[Entity]Status
  createdAt: string
  updatedAt: string
}

export interface I[Entity]Profile extends I[Entity] {
  description?: string
}
```

Naming: interfaces are prefixed `I`, the derived union is prefixed `T`, the const value keeps its plain name (`[Entity]Status` value, `T[Entity]Status` type — distinct identifiers).

Usage in code:

```typescript
import { [Entity]Status } from "@/entities/[entity]"
import type { I[Entity], T[Entity]Status } from "@/entities/[entity]"

if (item.status === [Entity]Status.Active) {
  // ...
}

const setStatus = (status: T[Entity]Status) => {
  // status is "active" | "archived"
}
```

Why not `enum`:

- Numeric enums leak runtime objects and don't tree-shake.
- String enums are nominally typed — they don't accept the underlying string literal, which makes API/JSON round-trips awkward.
- The `as const` pattern gives you a real const value AND a literal-union type with zero extra runtime cost.

### `api/[entity].api.ts`

```typescript
// src/entities/[entity]/api/[entity].api.ts
import type { I[Entity] } from "../model/types"

import { httpClient } from "@/shared/lib"

export const [entity]Api = {
  getById: async (id: string): Promise<I[Entity]> => {
    return httpClient.get(`[entity]/${id}`).json<I[Entity]>()
  },
}
```

### `api/[entity].queries.ts`

```typescript
// src/entities/[entity]/api/[entity].queries.ts
import { queryOptions } from "@tanstack/react-query"

import { [entity]Api } from "./[entity].api"

import { [ENTITY]_ENTITY, [ENTITY]_QUERY_KEYS } from "@/entities/[entity]/model/constants"
import { createQueryKeyFactory } from "@/shared/lib/react-query"

export const [entity]Keys = createQueryKeyFactory([ENTITY]_ENTITY, (all) => ({
  byId: (id: string) => [...all(), id] as const,
}))

export const [entity]Queries = {
  byId: (id: string) =>
    queryOptions({
      queryKey: [entity]Keys.byId(id),
      queryFn: () => [entity]Api.getById(id),
    }),
}
```

### `index.ts` (public API)

`[Entity]Status` (the const object value) and `T[Entity]Status` (the derived union type) are distinct identifiers, so the value is a value-export and the type a `type`-export:

```typescript
// src/entities/[entity]/index.ts
export { [entity]Api } from "./api/[entity].api"
export { [entity]Queries, [entity]Keys } from "./api/[entity].queries"
export { [Entity]Status } from "./model/constants"
export type { I[Entity], I[Entity]Profile, T[Entity]Status } from "./model/types"
```

External code consumes the entity only through this barrel:

```typescript
import { [entity]Queries, [Entity]Status } from "@/entities/[entity]"
import type { I[Entity], T[Entity]Status } from "@/entities/[entity]"
```

---

## Feature Example

A feature bundles the **write-side** of a flow (mutations) plus the hooks that compose it for UI.

### Folder layout

```
src/features/[feature]/
├── api/
│   ├── [feature].api.ts         # direct HTTP calls
│   └── [feature].mutations.ts   # use…Mutation hooks
├── hooks/
│   └── use-[feature].ts         # high-level facade combining state + mutations
├── model/
│   ├── types.ts                 # request/response shapes
│   └── schemas.ts               # zod schemas for the feature's forms
└── index.ts                     # barrel
```

### `model/types.ts`

```typescript
// src/features/[feature]/model/types.ts
export interface I[Feature]Payload {
  name: string
  email: string
}

export interface I[Feature]Result {
  id: string
}
```

### `api/[feature].api.ts`

```typescript
// src/features/[feature]/api/[feature].api.ts
import type { I[Feature]Payload, I[Feature]Result } from "../model/types"

import { httpClient } from "@/shared/lib"

export const [feature]Api = {
  submit: async (payload: I[Feature]Payload): Promise<I[Feature]Result> => {
    return httpClient.post("[entity]", { json: payload }).json<I[Feature]Result>()
  },
}
```

> When a call must bypass the shared client (e.g. an auth flow that must not send the Bearer token), call `ky` directly with `env.VITE_API_URL` instead of `httpClient`.

### `hooks/use-[feature].ts` — composing API + state

```typescript
// src/features/[feature]/hooks/use-[feature].ts
import { use[Feature]Mutation } from "../api/[feature].mutations"

export const use[Feature] = () => {
  const mutation = use[Feature]Mutation()

  return {
    submit: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
  }
}
```

### `index.ts` (public API)

```typescript
// src/features/[feature]/index.ts
export { use[Feature] } from "./hooks/use-[feature]"
export { use[Feature]Mutation } from "./api/[feature].mutations"
export type { I[Feature]Payload, I[Feature]Result } from "./model/types"
```

---

## Query Key Factory & TanStack Query

### The factory itself (`src/shared/lib/react-query/query-key-factory.ts`)

```typescript
type TQueryKeyFactory<T extends Record<string, (...args: never[]) => readonly unknown[]>> = {
  [K in keyof T]: T[K]
} & {
  all: () => readonly [string]
}

export const createQueryKeyFactory = <
  T extends Record<string, (...args: never[]) => readonly unknown[]>,
>(
  entity: string,
  keys: (all: () => readonly [string]) => T
): TQueryKeyFactory<T> => {
  const all = () => [entity] as const
  return { all, ...keys(all) }
}
```

### Defining keys + queryOptions

Defined inside the entity (`entities/[entity]/api/[entity].queries.ts`). Constants live in `model/constants.ts` to keep string segments out of the api layer.

```typescript
// entities/[entity]/api/[entity].queries.ts
export const [entity]Keys = createQueryKeyFactory([ENTITY]_ENTITY, (all) => ({
  byId: (id: string) => [...all(), id] as const,
  list: (filters: { status?: T[Entity]Status }) => [...all(), [ENTITY]_QUERY_KEYS.LIST, filters] as const,
}))

export const [entity]Queries = {
  byId: (id: string) =>
    queryOptions({ queryKey: [entity]Keys.byId(id), queryFn: () => [entity]Api.getById(id) }),
  list: (filters: { status?: T[Entity]Status }) =>
    queryOptions({ queryKey: [entity]Keys.list(filters), queryFn: () => [entity]Api.getList(filters) }),
}
```

### Consuming a query in a component

```tsx
import { useQuery } from "@tanstack/react-query"
import { [entity]Queries } from "@/entities/[entity]"

export const [Entity]Badge = ({ id }: { id: string }) => {
  const { data: item, isPending } = useQuery([entity]Queries.byId(id))
  if (isPending || !item) return null
  return <span>{item.name}</span>
}
```

### Invalidation patterns

```typescript
// Invalidate a specific query
queryClient.invalidateQueries({ queryKey: [entity]Keys.byId(id) })

// Invalidate all [entity]-scoped queries
queryClient.invalidateQueries({ queryKey: [entity]Keys.all() })
```

---

## Mutations & Cache Invalidation

Mutations live in the **feature** that owns the action, and invalidate the **entity** keys that the action affects.

```typescript
// src/features/[feature]/api/[feature].mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { [feature]Api } from "./[feature].api"

import { [entity]Keys } from "@/entities/[entity]"

export const use[Feature]Mutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: [feature]Api.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entity]Keys.all() })
    },
    onError: (error) => {
      console.error("[feature] failed:", error)
    },
  })
}
```

Rules visible in this example:

- Mutation hooks are colocated with the api in `api/[name].mutations.ts`.
- The mutation imports query keys from the entity it touches (`@/entities/[entity]`) — features may depend on entities, never the reverse.
- Side-effects (cache invalidation, storage) belong in `onSuccess` / `onError`, not in the component.

---

## Typing & File Splitting

### Prefer `as const` objects over `enum`

For closed sets of string literals (roles, statuses, kinds, query-key segments), use a `const` object + derived union type instead of a TypeScript `enum`. **The value lives in `model/constants.ts`; the derived type lives in `model/types.ts`** (see the Entity Example above).

```typescript
// model/constants.ts — the value
export const [Entity]Status = {
  Draft: "draft",
  Pending: "pending",
  Paid: "paid",
  Refunded: "refunded",
} as const
```

```typescript
// model/types.ts — the derived type
import type { [Entity]Status } from "./constants"

export type T[Entity]Status = (typeof [Entity]Status)[keyof typeof [Entity]Status]
```

If `constants.ts` needs the union to annotate another constant, either let inference do it (`export const OPTIONS = Object.values([Entity]Status)` infers `T[Entity]Status[]`) or `import type { T[Entity]Status } from "./types"` — the type-only import is erased, so no runtime cycle results.

### Naming: `I` for interfaces, `T` for types

- `interface I[Entity]`, `interface I[Feature]Payload`, `interface I[Widget]Props`
- `type T[Entity]Status`, `type T[Feature]FormValues`, `type TQueryKey`
- The derived type from a `const` object also gets the `T` prefix — the value keeps its plain name (`[Entity]Status` value, `T[Entity]Status` type).
- Generic parameters keep the standard short form (`T`, `K`, `V`, `TData`) — no double prefix.

### Default: one `model/types.ts`

Most modules need a single `model/types.ts`. Co-locate domain interfaces, derived unions, and helper aliases together — readers can scan one file. (The `as const` values they derive from live in `constants.ts`.)

```typescript
// features/[feature]/model/types.ts
export interface I[Feature]Payload { name: string; email: string }
export interface I[Feature]Result { id: string }
export type T[Feature]FormValues = z.infer<typeof [feature]Schema>
```

### When `types.ts` gets large — split by concern, not by usage site

If a module's types file grows past ~150 lines or covers clearly separate concerns, convert it into a `model/types/` folder and re-export from a single `index.ts`:

```
features/[feature]/model/
├── types/
│   ├── [concern-a].ts   # one cohesive group of types
│   ├── [concern-b].ts   # another cohesive group
│   └── index.ts         # export * from "./[concern-a]" / "./[concern-b]"
├── constants.ts
└── schemas.ts
```

```typescript
// features/[feature]/model/types/index.ts
export * from "./[concern-a]"
export * from "./[concern-b]"
```

Rules:

- **Never** scatter `*.types.ts` next to api / ui / hooks files. They must live under `model/`.
- Consumers always import from `../model/types` (or the module barrel), not from a specific sub-file.
- Inferred types from zod schemas live next to the schema (`model/schemas.ts`) and may be re-exported from `model/types.ts` if needed externally.

---

## Validation Schemas (`schemas.ts`)

All zod validation lives in `model/schemas.ts`. Do **not** inline schemas inside components or API files.

### Defining a schema + inferring the type

```typescript
// features/[feature]/model/schemas.ts
import { z } from "zod"

export const [feature]Schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const [feature]ExtendedSchema = [feature]Schema.extend({
  name: z.string().min(2, "Name is too short"),
})

export type T[Feature]FormValues = z.infer<typeof [feature]Schema>
export type T[Feature]ExtendedFormValues = z.infer<typeof [feature]ExtendedSchema>
```

### Reference: env validation (`src/shared/config/env/schema.ts`)

```typescript
import { z } from "zod"

const envSchema = z.object({
  MODE: z.enum(["development", "production"]).default("development"),
  VITE_API_URL: z.string().url(),
  VITE_APP_NAME: z.string().default("React App"),
  VITE_ENABLE_DEVTOOLS: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
})

export type TEnv = z.infer<typeof envSchema>
export { envSchema }
```

### Using a schema with React Hook Form

```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { [feature]Schema, type T[Feature]FormValues } from "../model/schemas"

const form = useForm<T[Feature]FormValues>({
  resolver: zodResolver([feature]Schema),
  defaultValues: { email: "", password: "" },
})
```

Rules:

- Filename: `schemas.ts` for multiple schemas, or `[name].schema.ts` if a single dominant schema (e.g. `env/schema.ts`).
- Always `export type X = z.infer<typeof xSchema>` next to the schema — no manual duplicate interfaces.
- Schemas and their inferred types are imported via `../model/schemas` from inside the module, or via the module barrel from outside.

---

## Compound Component Pattern

When a component has 2+ tightly related sub-components, export an object with `.Root` and named sub-components.

### Definition

```tsx
// src/widgets/[widget]/ui/[widget].tsx
import type { FC, ReactNode } from "react"

import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar"

interface I[Widget]Props {
  children: ReactNode
}

const [Widget]Root: FC<I[Widget]Props> = ({ children }) => {
  return <SidebarProvider>{children}</SidebarProvider>
}

const [Widget]Aside: FC = () => {
  return <Aside />
}

const [Widget]Main: FC<{ children: ReactNode }> = ({ children }) => {
  return <SidebarInset>{children}</SidebarInset>
}

const [Widget]Header: FC = () => {
  return <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">…</header>
}

const [Widget]Content: FC<{ children: ReactNode }> = ({ children }) => {
  return <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
}

export const [Widget] = {
  Root: [Widget]Root,
  Aside: [Widget]Aside,
  Main: [Widget]Main,
  Header: [Widget]Header,
  Content: [Widget]Content,
}
```

### Usage

```tsx
<[Widget].Root>
  <[Widget].Aside />
  <[Widget].Main>
    <[Widget].Header />
    <[Widget].Content>{children}</[Widget].Content>
  </[Widget].Main>
</[Widget].Root>
```

Rules:

- 2+ sub-components → use this pattern.
- Always expose `.Root` as the wrapper.
- Internal helpers that are not part of the public surface stay as separate files in the module, not on the compound object.
- Does **not** apply to `shared/ui/` — those are managed by shadcn and stay flat.

---

## Extending Base Components

When you build on top of a shadcn (or any base) component, **inherit its props** rather than redeclaring HTML attributes or variants.

### shadcn `Button` — the base

```tsx
// src/shared/ui/button.tsx
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  // ...
}
```

### A domain-specific wrapper (`SubmitButton`)

```tsx
// features/[feature]/ui/submit-button.tsx
import type { ComponentProps, FC } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib"

interface ISubmitButtonProps extends ComponentProps<typeof Button> {
  isPending?: boolean
}

export const SubmitButton: FC<ISubmitButtonProps> = ({
  isPending,
  disabled,
  className,
  children,
  ...rest
}) => {
  return (
    <Button
      type="submit"
      disabled={disabled || isPending}
      className={cn("relative", className)}
      {...rest}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : children}
    </Button>
  )
}
```

What this gets us for free:

- All HTML `<button>` attributes (`onClick`, `aria-*`, `data-*`, `form`, `name`, `value`, …)
- All shadcn variants (`variant`, `size`, `asChild`) via `VariantProps`
- `className` merging via `cn()`
- `disabled` works correctly because we spread `...rest` *after* our own override only where needed

Rules:

- Use `ComponentProps<typeof Button>` (or the exported `ButtonProps`) — never copy-paste props.
- Forward `...rest` to the base component.
- Don't re-declare variant props — re-export base variants if a consumer needs them.
- Wrappers tied to a domain go inside the matching feature/entity/widget `ui/` folder, never in `shared/ui/`.

### Another example — Input with leading icon

```tsx
// features/[feature]/ui/search-input.tsx
import type { ComponentProps, FC, ReactNode } from "react"

import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib"

interface ISearchInputProps extends ComponentProps<typeof Input> {
  icon: ReactNode
}

export const SearchInput: FC<ISearchInputProps> = ({ icon, className, ...rest }) => {
  return (
    <div className="relative">
      <span className="absolute top-1/2 left-2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <Input className={cn("pl-8", className)} {...rest} />
    </div>
  )
}
```

---

## Barrel Exports

Every module exposes its public API through one `index.ts`. External code may **only** import from the barrel — never reach into a module's internal files.

### Entity barrel

```typescript
// src/entities/[entity]/index.ts
export { [entity]Api } from "./api/[entity].api"
export { [entity]Queries, [entity]Keys } from "./api/[entity].queries"
export { [Entity]Status } from "./model/constants"
export type { I[Entity], I[Entity]Profile, T[Entity]Status } from "./model/types"
```

Note: the `as const` value (`[Entity]Status`) is re-exported from `./model/constants`, the derived type (`T[Entity]Status`) from `./model/types` — each from the file it lives in.

### Feature barrel

```typescript
// src/features/[feature]/index.ts
export { use[Feature] } from "./hooks/use-[feature]"
export { use[Feature]Mutation } from "./api/[feature].mutations"
export type { I[Feature]Payload, I[Feature]Result } from "./model/types"
```

### Widget barrel

```typescript
// src/widgets/[widget]/index.ts
export { [Widget] } from "./ui/[widget]"
export { [widget]Config } from "./config/[widget].config"
export type { I[Widget]Config, I[Widget]Item } from "./model/types"
```

### Consuming

```typescript
// ✅ Correct — through the barrel
import { use[Feature] } from "@/features/[feature]"
import { [entity]Queries } from "@/entities/[entity]"
import type { I[Entity] } from "@/entities/[entity]"
import { [Widget] } from "@/widgets/[widget]"

// ❌ Wrong — reaching into internals
import { use[Feature] } from "@/features/[feature]/hooks/use-[feature]"
import { [entity]Api } from "@/entities/[entity]/api/[entity].api"
```

Exception: shadcn components in `shared/ui/` are imported directly by file path (`@/shared/ui/button`) — they're not a module, they're a flat component library managed by shadcn CLI.

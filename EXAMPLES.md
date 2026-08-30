# EXAMPLES.md

Concrete reference code for every convention in [`CONVENTIONS.md`](./CONVENTIONS.md), split into per-topic files under [`examples/`](./examples/).

**Read only the file(s) matching what you are building or reviewing — never all of them.**

| You are touching | Read |
| --- | --- |
| module layout / new module skeleton | [examples/fsd-module-anatomy.md](./examples/fsd-module-anatomy.md) |
| an entity (`model/`, `api/*.api.ts`) | [examples/entity.md](./examples/entity.md) |
| a feature (`api/`, `hooks/`) | [examples/feature.md](./examples/feature.md) |
| `api/*.queries.ts`, query keys | [examples/queries.md](./examples/queries.md) |
| `api/*.mutations.ts`, invalidation | [examples/mutations.md](./examples/mutations.md) |
| `model/types.ts`, `model/constants.ts`, `as const` "enums" | [examples/typing.md](./examples/typing.md) |
| `model/schemas.ts`, forms + RHF | [examples/schemas.md](./examples/schemas.md) |
| compound components | [examples/compound-component.md](./examples/compound-component.md) |
| wrappers over shadcn/base components | [examples/extending-components.md](./examples/extending-components.md) |
| `index.ts` barrels | [examples/barrels.md](./examples/barrels.md) |

**Placeholders.** Every example uses abstract placeholders, never a real module from this repo (the scaffolded `src/` modules are template examples and may be deleted). Substitute your own names:
`[entity]` / `[feature]` / `[widget]` — the kebab-case module name · `[Entity]` — its PascalCase form · `I[Entity]`, `T[Entity]Status` — its types · `[ENTITY]_ENTITY`, `[ENTITY]_QUERY_KEYS` — its constants · `[entity]Api`, `[entity]Keys`, `[entity]Queries` — its api surface. Real infrastructure under `shared/` (`httpClient`, `createQueryKeyFactory`, `env`, shadcn primitives in `shared/ui/`) is referenced by its real name — it's the foundation layer, always present.

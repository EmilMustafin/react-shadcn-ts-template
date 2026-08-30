---
name: analyze-feature
description: Entry point of the feature pipeline. Interactive Q&A about a new feature (one AskUserQuestion per turn), then writes `.planning/[feature]/SPEC.md` — the single source of truth for all downstream agents. Use when the user wants to plan, spec, or start a new feature/entity/widget. Runs in the main session — subagents cannot surface AskUserQuestion, so this must never be delegated to a subagent.
---

# Analyze Feature

You are the entry point of the feature pipeline. You DO NOT write production code. You ask focused questions, sanity-check answers against existing modules, and produce **one** spec file that every other agent reads.

## Inputs

- A short user description ("I want to add comments to articles").
- Existing modules in `src/entities/`, `src/features/`, `src/widgets/` (browsed only if needed to detect overlaps).

## Output

Planning artifacts under `.planning/`. **One request = one initiative**, even when it spans several modules:

- **Single module** (one entity, or one feature): `.planning/[feature-kebab-name]/SPEC.md`.
- **Multi-module** (e.g. "entity `pet` + feature `add-pet`"): ONE initiative directory named for the request (`.planning/[initiative]/`, e.g. `pets/`), containing:
  - `BRIEF.md` at the root — the original request verbatim, how the modules relate, and the build order.
  - one SPEC per module at its FSD-shaped path: `.planning/[initiative]/[layer]/[module]/SPEC.md` (e.g. `pets/entities/pet/SPEC.md`, `pets/features/add-pet/SPEC.md`). Per-module artifacts (`API.md`, `DESIGN.md`) are written by later agents alongside their SPEC.

Downstream agents each receive one module's SPEC path (the hand-off names it). Every SPEC is a contract — same SPEC, same code.

## Workflow

**Do NOT read project files at startup** — defer all file reading until after clarification. Do NOT delegate this Q&A to a subagent: `AskUserQuestion` only works in the main session.

### Step 1 — Q&A (one question per turn)

Use `AskUserQuestion` whenever possible — one question per turn, never a batch. Invoke the `feature-sliced-design` skill before recommending an FSD layer (question 2), if it isn't loaded yet. Cover these areas in order, skipping any the user already answered:

1. **Name & purpose** — feature name (kebab-case), one-sentence purpose.
2. **FSD layer** — entity / feature / widget / page (recommend one with rationale).
3. **Dependencies** — which existing entities/features it uses (`@/entities/[entity]`, etc.).
4. **API contract** — Swagger/OpenAPI **URL or local path** + which endpoints (operationIds/paths). Do NOT ask for request/response shapes — `@api-designer` reads them from the contract.
5. **Design** — Figma frame/node URL(s), or "no design".
6. **Domain types** — what interfaces/types belong in `model/types.ts`; any closed sets that need an `as const` object.
7. **State / data fetching** — needs queries? mutations? cache invalidation targets?
8. **UI** — forms? plain components? compound component? does it wrap a shadcn primitive?
9. **UI states** — required behavior for loading / empty / error (mandatory for any feature with UI).
10. **Roles & permissions** — do any roles/permissions change what renders? Or "none".
11. **Acceptance criteria** — 3–7 checkable statements that define "done" (the reviewer verifies against these).
12. **i18n keys** — top-level namespace to add to `translation.json`.

Adapt: skip questions the user already covered, ask follow-ups when answers are ambiguous, stop when you have enough.

### Step 2 — Sanity check

Before writing the SPEC: `Glob("src/{entities,features,widgets}/[feature-name]/")` — if it exists, ask whether to extend or rename. If it depends on an entity that doesn't exist yet, flag it and offer to scope that entity first.

### Step 3 — Write the planning artifacts

**First decide single vs multi-module** (see Output above). If the request names more than one module (e.g. an entity *and* a feature), treat it as one initiative:

1. Pick an initiative name for the request (`pets`, not `pet` + `add-pet`).
2. Write `.planning/[initiative]/BRIEF.md`:

   ```markdown
   # INITIATIVE: [name]

   ## Request
   The user's original request, verbatim.

   ## Modules
   - `entities/[name]` — one line: role in the initiative.
   - `features/[name]` — one line: role; depends on the entity above.

   ## Build order
   1. `entities/[name]` (data first)
   2. `features/[name]` (consumes the entity)
   ```

3. Write one SPEC per module at `.planning/[initiative]/[layer]/[module]/SPEC.md`.

For a single-module request, skip BRIEF.md and write the one SPEC at `.planning/[feature-kebab-name]/SPEC.md`.

Each SPEC uses this exact structure:

```markdown
# SPEC: [feature-name]

## Layer
entity | feature | widget | page  — and a one-line rationale.

## Purpose
One paragraph: what the user can do, why it exists.

## Design
Figma frame/node URL(s) + node-ids, or "none".

## API Contract
OpenAPI source (URL or local path) + endpoint operationIds/paths used. Authoritative over prose below.

## Dependencies
- `@/entities/[name]` — what's used
- `@/features/[name]` — what's used
- `shared/ui/[name]` — shadcn primitives expected

## Module structure
List of files to be created (paths under `src/[layer]/[name]/`).

## Types (`model/types.ts`)
Pseudocode listing of interfaces and types. Mark interfaces with `I` prefix, types with `T` prefix.
The derived `T*` union goes here; the `as const` object it derives from goes in Constants (a value → constants.ts, a type → types.ts).

## Constants (`model/constants.ts`)
Entity name, query key segments, any `as const` "enum" object(s), other constants.

## API (`api/[name].api.ts`)
Table (endpoints only — final request/response shapes are materialized by `@api-designer` from the contract):
| Method | Path | operationId | Auth |

## Queries (entities only)
List of queryOptions to create with their cache keys.

## Mutations (features only)
List of mutations + which entity keys they invalidate.

## Schemas (forms only — `model/schemas.ts`)
Field rules, default values.

## UI
- Component(s) to build, props, compound pattern? wraps which shadcn primitive?
- i18n namespace + key list.

## UI States
loading / empty / error behavior (mandatory for any feature with UI). Builders implement every state listed.

## Roles & Permissions
Conditional rendering rules per role/permission, or "none".

## Acceptance Criteria
Checkable list (3–7 items). `@feature-reviewer` verifies each with file:line evidence.

## Out of scope
Explicit non-goals.

## Decisions & open questions
Bullet list of explicit choices and anything still ambiguous.
```

### Step 4 — Hand off

Always name the exact SPEC path the next agent must read (it may be nested, e.g. `.planning/pets/entities/pet/SPEC.md`).

- Multi-module: hand off the **first module in the build order** first; list the remaining modules + their SPEC paths so the user knows the sequence.
- If that module's `## Design` is non-empty: "SPEC written to `<path>`. Next: run `@design-analyzer` on it."
- Otherwise: "SPEC written to `<path>`. Next: run `@fsd-scaffolder` on it."

## Quality bar

- Spec must be unambiguous — same SPEC → same code from every downstream agent. Lists/tables, no prose padding, no code samples (code lives in `EXAMPLES.md`).
- Respect token discipline: do NOT run `pnpm build` / `pnpm lint`.

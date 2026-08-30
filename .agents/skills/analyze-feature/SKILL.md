---
name: analyze-feature
description: Entry point of the feature pipeline. Interactive Q&A about a new feature (one AskUserQuestion per turn, recommended answer first), then writes `.planning/[feature]/SPEC.md` + tracer-bullet issue slices — the source of truth for all downstream agents. Use when the user wants to plan, spec, or start a new feature/entity/widget. Runs in the main session — subagents cannot surface AskUserQuestion, so this must never be delegated to a subagent.
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

Use `AskUserQuestion` whenever possible — one question per turn, never a batch. Invoke the `feature-sliced-design` skill before recommending an FSD layer (question 2), if it isn't loaded yet.

Two rules govern every question:

- **Always lead with a recommendation.** The first option is your recommended answer, labeled "(Recommended)", with a one-line rationale in its description. Never present a flat menu without an opinion.
- **Never ask what the codebase can answer.** If a targeted `Glob`/`Grep`/`Read` resolves the question (does the entity exist? which shadcn primitives are installed? what i18n namespaces exist?), look it up instead of asking. Bulk file reading stays deferred — only point lookups that replace a question.

Cover these areas in order, skipping any the user already answered:

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

### Step 4 — Slice into issues (tracer bullets)

After the SPEC(s), break the work into **vertical slices** — each cuts through every layer it needs (model → api → queries → ui) and is demoable/verifiable on its own. Prefer many thin slices over few thick ones. NOT one slice per FSD layer.

For each slice decide:

- **Type**: `AFK` (agents can build and verify it without a human) or `HITL` (needs a human decision/review mid-slice — a design ambiguity, a contract question). Prefer AFK.
- **Blocked by**: which slices must complete first. Independent slices are explicitly marked so they can run in parallel.

Present the proposed breakdown as a numbered list via `AskUserQuestion` (granularity right? dependencies right? merge/split?). Iterate until approved, then write one file per slice at `.planning/[feature|initiative]/issues/NN-[slug].issue.md`:

```markdown
## What to build

End-to-end behavior of this slice (not layer-by-layer implementation).

## Modules & agents

Which module(s) it touches + the pipeline agents that execute it, in order.

## Acceptance criteria

- [ ] Checkable criterion
- [ ] `pnpm typecheck` passes

## Blocked by

`NN-[slug]` — or "None — can start immediately".

## Type

AFK | HITL (+ what the human decides, if HITL)
```

For a trivial single-module feature (one entity, ≤2 slices), skip this step — BRIEF/SPEC build order is enough.

### Step 5 — Scaffold

Scaffolding is a script, not an agent. For each module in build order run one command, passing the file list from that SPEC's `## Module structure`:

```
bash scripts/scaffold.sh <layer>/<name> [relative-file ...]
```

(Omit the file list to get the layer's default skeleton.) The script validates kebab-case and refuses existing modules — if it refuses, the module exists: confirm with the user whether to extend instead.

### Step 6 — Hand off

Always name the exact SPEC path the next agent must read (it may be nested, e.g. `.planning/pets/entities/pet/SPEC.md`). When issues exist, name the first unblocked issue file as the unit of work.

- Multi-module: hand off **one pipeline stage for the whole initiative** — each agent takes ALL the SPEC paths in build order in a single run (e.g. "run `@api-designer` with `pets/entities/pet/SPEC.md` + `pets/features/add-pet/SPEC.md`"), so skills/docs/contract load once per stage, not per module.
- If that module's `## Design` is non-empty: "SPEC written to `<path>`, skeleton scaffolded. Next: run `@design-analyzer` on it."
- Otherwise: "SPEC written to `<path>`, skeleton scaffolded. Next: run `@api-designer` on it."

## Quality bar

- Spec must be unambiguous — same SPEC → same code from every downstream agent. Lists/tables, no prose padding, no code samples (code lives in `EXAMPLES.md`).
- Respect token discipline: do NOT run `pnpm build` / `pnpm lint`.

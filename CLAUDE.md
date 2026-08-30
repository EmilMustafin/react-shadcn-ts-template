# CLAUDE.md

> **IMPORTANT:** First read `CONVENTIONS.md` in the project root — it contains all shared project conventions (architecture, code style, patterns, commands). For concrete reference code per convention, see `EXAMPLES.md`.
>
> **Token discipline:** do NOT run `pnpm build`, `pnpm lint`, or `pnpm stylelint` as verification — they are wired into Husky's pre-commit hook and CI. Use `pnpm typecheck` if explicit type validation is needed.

## MCP Servers

Configured in `.mcp.json`:

- `shadcn` — shadcn/ui CLI integration (component search, docs, add)
- `context7` — real-time library documentation (React 19, TanStack Query, React Router, Zod, etc.). Append "use context7" to prompts for up-to-date docs
- `figma` — Figma design-to-code workflow (get_design_context, screenshots, metadata)

## Claude Code Skills

Skills in `.claude/skills/` — auto-loaded by agents via the `skills` frontmatter field:

- `shadcn` — shadcn/ui component usage rules
- `vercel-react-best-practices` — React performance patterns
- `vercel-composition-patterns` — React composition patterns
- `feature-sliced-design` — FSD architecture methodology
- `tanstack-query-best-practices` — TanStack Query data fetching and caching
- `react-hook-form-zod` — React Hook Form + Zod validation patterns
- `analyze-feature` — **pipeline entry point** (user-invocable via `/analyze-feature`, not agent-loaded): interactive Q&A → writes `SPEC.md`

## Claude Code Agents

Standalone agents in `.claude/agents/` — each step is intentionally narrow and reads a shared spec file produced by the `/analyze-feature` skill.

> **Why the entry point is a skill, not an agent:** `AskUserQuestion` does not surface from a subagent — subagents run headless and return only a final report. Interactive Q&A therefore lives in the main session (`/analyze-feature`); every subagent that hits missing input exits with a report asking for it instead of prompting.

### Pipeline

```
/analyze-feature (skill, main session) → design-analyzer? → fsd-scaffolder → api-designer (OpenAPI-driven)
→ query-builder → ui-builder (form / non-form branch) → feature-reviewer (+ design fidelity)
```

`design-analyzer` runs whenever the feature has a Figma source. Every pipeline agent reads `.planning/[feature]/SPEC.md` as its source of truth.

### Artifacts (per module, in `.planning/[feature]/`)

Each handoff consumes a machine-readable artifact instead of a human retelling:

| Artifact | Producer | Consumers |
|---|---|---|
| `SPEC.md` | `/analyze-feature` skill | all downstream |
| `DESIGN.md` | design-analyzer (Figma via MCP) | ui-builder, feature-reviewer |
| `API.md` | api-designer (from OpenAPI) | query-builder, feature-reviewer |

**One request = one initiative.** A single-module request writes `.planning/[feature]/SPEC.md`. A multi-module request is grouped under one initiative dir: `.planning/[initiative]/BRIEF.md` + one SPEC per module at its FSD-shaped path (e.g. `.planning/pets/entities/pet/SPEC.md`, `.planning/pets/features/add-pet/SPEC.md`), with `API.md`/`DESIGN.md` alongside each SPEC. So `[feature]` above may be a nested path — the hand-off names the exact one.

> Code Connect is not set up yet (the template has no design-system Figma file). Once the project has one, map `src/shared/ui/*` via `mcp__figma__add_code_connect_map` — see AGENTS.md "One-time setup".

### Entry points by scenario

The full pipeline is for new features. Everything smaller enters mid-pipeline — executor agents accept a direct brief (target module + source) when no SPEC.md exists.

| Scenario | Entry |
|---|---|
| New feature | `/analyze-feature` (main session Q&A) → full pipeline |
| Bug — logic / data | `@bug-fixer` |
| Bug — markup vs design | `@bug-fixer` (give it the Figma frame); if the whole screen drifted, `@design-analyzer` point mode first |
| New endpoint in an existing module | `@api-designer` → `@query-builder` (direct brief) |
| New form in an existing feature | `@ui-builder` (direct brief) |
| New screen/component from a design | `@design-analyzer` → `@ui-builder` |
| Pre-merge check of any of the above | `@feature-reviewer` |

### Agents

The Q&A entry point is the `/analyze-feature` **skill** (main session), not an agent — see the note above.

| Agent | Skills | Purpose |
|---|---|---|
| `design-analyzer` | shadcn | Reads Figma via MCP as structured data → writes `DESIGN.md` (token map, component inventory, states). No code. |
| `fsd-scaffolder` | feature-sliced-design | Reads SPEC → creates folders + empty files + barrel. No logic. |
| `api-designer` | tanstack-query | Reads the OpenAPI contract → fills `model/types.ts`, `model/constants.ts`, `api/[name].api.ts` + writes `API.md`. |
| `query-builder` | tanstack-query | Adds `[name].queries.ts` (entities) / `[name].mutations.ts` (features). |
| `ui-builder` | react-hook-form-zod, shadcn, react-best-practices, composition-patterns | The UI layer, branching on form vs non-form. Form: Zod schema in `model/schemas.ts` + `ui/[name]-form.tsx` wired to a mutation. Non-form: compound components, shadcn wrappers, presentational UI. i18n, dark mode, model-layer types/constants. Consumes `DESIGN.md`. |
| `feature-reviewer` | shadcn, fsd, tanstack-query, react-best-practices, composition-patterns, react-hook-form-zod | Reviews against CLAUDE/AGENTS/CONVENTIONS/EXAMPLES + design fidelity vs `DESIGN.md` + API shapes vs `API.md` + acceptance criteria; runs only `pnpm typecheck`. |
| `bug-fixer` | — | Outside the pipeline: reproduces → localizes → fixes one bug with the minimal diff. Artifact `.planning/fixes/[slug].md` only for non-trivial fixes. |

### Usage

Start a new feature with the skill (interactive Q&A in the main session):

```
/analyze-feature I want to add comments to articles
```

Then type `@` in the Claude Code prompt and select the agent from autocomplete:

```
@design-analyzer   — read Figma → write DESIGN.md (when the feature has a design)
@fsd-scaffolder    — create module structure
@api-designer      — read OpenAPI contract → API layer + API.md
@query-builder     — set up TanStack Query
@ui-builder        — build the UI (form with validation, or non-form component)
@feature-reviewer  — review the feature before merge
@bug-fixer         — reproduce → localize → minimal fix (outside the pipeline)
```

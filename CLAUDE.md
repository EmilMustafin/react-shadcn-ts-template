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

## Claude Code Agents

Standalone agents in `.claude/agents/` — each step is intentionally narrow and reads a shared spec file produced by `feature-analyzer`.

### Pipeline

```
feature-analyzer → design-analyzer? → fsd-scaffolder → api-designer (OpenAPI-driven)
→ query-builder → form-builder? / component-builder? → feature-reviewer (+ design fidelity)
```

`design-analyzer` runs whenever the feature has a Figma source. Every agent after `feature-analyzer` reads `.planning/[feature]/SPEC.md` as its source of truth.

### Artifacts (per feature, in `.planning/[feature]/`)

Each handoff consumes a machine-readable artifact instead of a human retelling:

| Artifact | Producer | Consumers |
|---|---|---|
| `SPEC.md` | feature-analyzer | all downstream |
| `DESIGN.md` | design-analyzer (Figma via MCP) | form-builder, component-builder, feature-reviewer |
| `API.md` | api-designer (from OpenAPI) | query-builder, feature-reviewer |

> Code Connect is not set up yet (the template has no design-system Figma file). Once the project has one, map `src/shared/ui/*` via `mcp__figma__add_code_connect_map` — see AGENTS.md "One-time setup".

### Entry points by scenario

The full pipeline is for new features. Everything smaller enters mid-pipeline — executor agents accept a direct brief (target module + source) when no SPEC.md exists.

| Scenario | Entry |
|---|---|
| New feature | `@feature-analyzer` → full pipeline |
| Bug — logic / data | `@bug-fixer` |
| Bug — markup vs design | `@bug-fixer` (give it the Figma frame); if the whole screen drifted, `@design-analyzer` point mode first |
| New endpoint in an existing module | `@api-designer` → `@query-builder` (direct brief) |
| New form in an existing feature | `@form-builder` (direct brief) |
| New screen/component from a design | `@design-analyzer` → `@component-builder` |
| Pre-merge check of any of the above | `@feature-reviewer` |

### Agents

| Agent | Skills | Purpose |
|---|---|---|
| `feature-analyzer` | feature-sliced-design | Q&A about a new feature → writes `.planning/[feature]/SPEC.md`. No code. |
| `design-analyzer` | shadcn | Reads Figma via MCP as structured data → writes `DESIGN.md` (token map, component inventory, states). No code. |
| `fsd-scaffolder` | feature-sliced-design | Reads SPEC → creates folders + empty files + barrel. No logic. |
| `api-designer` | tanstack-query | Reads the OpenAPI contract → fills `model/types.ts`, `model/constants.ts`, `api/[name].api.ts` + writes `API.md`. |
| `query-builder` | tanstack-query | Adds `[name].queries.ts` (entities) / `[name].mutations.ts` (features). |
| `form-builder` | react-hook-form-zod, shadcn, react-best-practices | Schema in `model/schemas.ts` + form component in `ui/[name]-form.tsx`. Consumes `DESIGN.md`. |
| `component-builder` | shadcn, react-best-practices, composition-patterns | Non-form UI: compound components, shadcn wrappers, i18n, dark mode. Consumes `DESIGN.md`. |
| `feature-reviewer` | shadcn, fsd, tanstack-query, react-best-practices, composition-patterns, react-hook-form-zod | Reviews against CLAUDE/AGENTS/CONVENTIONS/EXAMPLES + design fidelity vs `DESIGN.md` + API shapes vs `API.md` + acceptance criteria; runs only `pnpm typecheck`. |
| `bug-fixer` | — | Outside the pipeline: reproduces → localizes → fixes one bug with the minimal diff. Artifact `.planning/fixes/[slug].md` only for non-trivial fixes. |

### Usage

Type `@` in the Claude Code prompt, then select the agent from autocomplete:

```
@feature-analyzer  — start: ask questions, write SPEC
@design-analyzer   — read Figma → write DESIGN.md (when the feature has a design)
@fsd-scaffolder    — create module structure
@api-designer      — read OpenAPI contract → API layer + API.md
@query-builder     — set up TanStack Query
@form-builder      — create a form with validation
@component-builder — build a UI component
@feature-reviewer  — review the feature before merge
@bug-fixer         — reproduce → localize → minimal fix (outside the pipeline)
```

Or run an agent as the main session:

```bash
claude --agent=feature-analyzer
```

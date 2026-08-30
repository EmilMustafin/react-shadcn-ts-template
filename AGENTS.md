# AGENTS.md

> **IMPORTANT:** First read `CONVENTIONS.md` in the project root — it contains all shared project conventions. For concrete reference code per convention (entity, feature, queries, mutations, schemas, compound components, extending shadcn components, etc.) see `EXAMPLES.md`.

## Agent-Specific Rules

- Always read `CONVENTIONS.md` before making any code changes; consult `EXAMPLES.md` when you need a working pattern
- Follow FSD layer dependency rule strictly — never import upward
- Use `@/` alias for all cross-layer imports
- All file and folder names must be `kebab-case`
- Every new module must have `index.ts` barrel export
- No semicolons, double quotes, trailing commas (Prettier config)
- Run `pnpm typecheck` after structural changes to verify types
- **Do NOT run `pnpm build`, `pnpm lint`, or `pnpm stylelint`** — they are wired into Husky's pre-commit hook and CI; running them locally only burns tokens

## MCP Servers

Configured in `.mcp.json`:

- `shadcn` — shadcn/ui CLI integration (component search, docs, add)
- `context7` — real-time library documentation. Append "use context7" to prompts for up-to-date docs
- `figma` — Figma design-to-code workflow (design context, screenshots, metadata)

## Skills

Canonical skill dirs live in `.agents/skills/` (`.claude/skills/` holds symlinks); provenance is pinned in `skills-lock.json`. **All skills are vendored — never edit them in this repo.** Our own skills come from [`vadimgaidai/agent-skills`](https://github.com/vadimgaidai/agent-skills) (`react/` group for any React project, `fsd/` group for FSD projects); to change one, edit it there, push, then run `npx skills update` here. Reinstall/update via `npx skills@latest add <owner>/<repo> -s <skill> -y` — **without `-a`** (an explicit `-a` switches the CLI to copy mode and breaks the symlink layout). Skills are auto-loaded by agents via the `skills` frontmatter field — agents do NOT need to read skill files manually. Every SKILL.md is a compact quick reference; deep dives live in the skill's `REFERENCE.md` / `references/` and are read on demand only.

- `shadcn` — shadcn/ui component usage rules (hub → `rules/*.md`)
- `vercel-react-best-practices` — React performance patterns (Next.js-oriented — skip `server-*`/RSC advice; never read its huge `AGENTS.md`, read `rules/<rule>.md`)
- `vercel-composition-patterns` — React composition patterns (same `AGENTS.md` caveat)
- `feature-sliced-design` — repo-specific FSD rules (`pages` layer, not `views`)
- `tanstack-query-best-practices` — TanStack Query data fetching and caching
- `react-hook-form-zod` — repo-specific RHF + Zod rules incl. `z.input === z.output`
- `analyze-feature` — **pipeline entry point** (user-invocable via `/analyze-feature`, not agent-loaded): interactive Q&A → `SPEC.md` + tracer-bullet issue slices
- `caveman` — ultra-terse output mode for the main session (user-invocable)

## Custom Agents

Standalone agents in `.claude/agents/`. The pipeline is sequential; each step is small and reads a shared spec file.

> **Why the entry point is a skill, not an agent:** `AskUserQuestion` does not surface from a subagent — subagents run headless and return only a final report. Interactive Q&A therefore lives in the main session (`/analyze-feature` skill); no subagent may carry `AskUserQuestion` in its tools. A subagent blocked on missing input exits with a report naming exactly what it needs.

### Pipeline

```
/analyze-feature (skill: SPEC + issues + scaffold via scripts/scaffold.sh) → design-analyzer?
→ api-designer (OpenAPI-driven) → query-builder → ui-builder (form / non-form branch)
→ feature-reviewer (+ design fidelity)
```

Scaffolding is a deterministic script, not an agent: `scripts/scaffold.sh <layer>/<name> [files…]` creates folders + placeholder files + barrel (default skeleton per layer when no files are given, kebab-case validated, refuses existing modules). The `/analyze-feature` skill runs it right after writing the SPEC; any agent finding the skeleton missing runs it too.

The `/analyze-feature` skill writes `.planning/[feature]/SPEC.md` (plus `issues/NN-[slug].issue.md` tracer-bullet slices with `Blocked by` + AFK/HITL marking for non-trivial features); every pipeline agent reads the SPEC as the source of truth, and an issue file names the unit of work. Two more machine-readable artifacts feed the pipeline so no handoff relies on a human retelling:

| Artifact | Producer | Consumers |
|---|---|---|
| `SPEC.md` | `/analyze-feature` skill | all downstream |
| `DESIGN.md` | design-analyzer (Figma via MCP, when the feature has a design) | ui-builder, feature-reviewer |
| `API.md` | api-designer (from the OpenAPI contract) | query-builder, feature-reviewer |

**Planning layout — one request = one initiative.** A single-module request writes `.planning/[feature]/SPEC.md`. A multi-module request (e.g. an entity + a feature) is grouped under one initiative directory: `.planning/[initiative]/BRIEF.md` (original request + how the modules relate + build order) plus one SPEC per module at its FSD-shaped path, e.g. `.planning/pets/entities/pet/SPEC.md` and `.planning/pets/features/add-pet/SPEC.md`. Per-module `API.md` / `DESIGN.md` sit alongside their SPEC. So `[feature]` in the agent tables below may be a nested path — the hand-off names the exact one.

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

Agent definitions in `.claude/agents/` are copies of masters in [`vadimgaidai/agent-skills`](https://github.com/vadimgaidai/agent-skills) `agents/fsd/` — same rule as hooks/rules/examples/scripts: edit the master, re-copy here, never author here. Masters carry no `model:` pin — agents inherit the session model; pin per-project only as a deliberate cost decision (mechanical `query-builder` is the usual downgrade candidate).

| Agent | Skills loaded | What it does |
|---|---|---|
| `design-analyzer` | shadcn | Reads the Figma source via MCP as structured data → writes `DESIGN.md` (token map, component inventory, layout, states). No code. Runs only when the feature has a Figma source. |
| `api-designer` | tanstack-query | Reads the OpenAPI/Swagger contract (authoritative over SPEC prose) → fills `model/types.ts`, `model/constants.ts`, `api/[name].api.ts` + writes `API.md`. |
| `query-builder` | tanstack-query | Adds `[name].queries.ts` (entities) or `[name].mutations.ts` (features). |
| `ui-builder` | react-hook-form-zod, shadcn, react-best-practices, composition-patterns | The UI layer, branching on form vs non-form. Form branch: Zod schema in `model/schemas.ts` + `ui/[name]-form.tsx` wired to a mutation. Non-form branch: compound components / shadcn wrappers / presentational UI. i18n, dark mode, model-layer types/constants. Consumes `DESIGN.md` (no guessed values). |
| `feature-reviewer` | — (rulebook = `CONVENTIONS.md` + `examples/*.md`, read on demand) | Reviews against CLAUDE/AGENTS/CONVENTIONS/EXAMPLES + design fidelity vs `DESIGN.md` + API shapes vs `API.md` + acceptance criteria; runs only `pnpm typecheck`. |
| `bug-fixer` | — | Outside the pipeline: reproduces → localizes → fixes one bug with the minimal diff. Writes `.planning/fixes/[slug].md` only for non-trivial fixes. |

### Agent design principles

- **Lean prompts** — each agent is ~50–120 lines. Canonical code lives in `EXAMPLES.md`; agents reference it instead of duplicating snippets. (`feature-reviewer` runs longer — it is the comprehensive gate.)
- **Lazy loading** — agents read project files only after they know what they need (mostly the SPEC + one matching reference module via `Glob()`). Q&A agents defer all file reading until after clarification.
- **Skills via frontmatter** — skills auto-inject without manual reads.
- **Artifacts as contracts** — given the same `SPEC.md` / `DESIGN.md` / `API.md`, every agent produces the same code. Design is read from Figma via MCP and API shapes from the OpenAPI contract — never from a human retelling.
- **Token discipline** — never run `pnpm build`, `pnpm lint`, or `pnpm stylelint`. Husky + CI already do this. Only `pnpm typecheck` is allowed.
- **Machine-enforced, not prompt-enforced** — formatting (PostToolUse Prettier hook), `I*`/`T*` prefixes, `enum` ban, `space-y/x-*` ban, shadcn barrel imports (ESLint), FSD paths + kebab-case (PreToolUse hooks). Agents and the reviewer spend zero tokens re-checking these.
- **Batch per initiative** — a multi-module initiative runs each pipeline stage ONCE with all SPEC paths in build order, not once per module. The OpenAPI contract is fetched once and cached at `.planning/[initiative]/contract.json`; agents read the cache.
- **Read only the matching example** — `EXAMPLES.md` is an index; agents read the specific `examples/*.md` file for what they touch, never the whole set.
- **One question per turn** — the `/analyze-feature` skill uses `AskUserQuestion` and never asks multiple questions at once.
- **No interactive prompts in subagents** — `AskUserQuestion` is main-session-only; a subagent missing input exits with a report asking for it.

### One-time setup: Code Connect (deferred — no design-system file yet)

`design-analyzer` calls `get_code_connect_map` to resolve Figma elements to project components. In this template the map is empty, so the component inventory is matched manually via the shadcn skill — works, but less precise. When the project gets its Figma design-system file, map `src/shared/ui/*` to its components once via `mcp__figma__add_code_connect_map`; after that `get_design_context` returns real project component names.

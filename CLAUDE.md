# CLAUDE.md

React + TypeScript + Vite SPA template, Feature-Sliced Design, shadcn/ui, TanStack Query, React 19 Compiler.

## How to work in this repo

- **Conventions**: `.claude/rules/code-style.md` auto-loads when touching `src/` — it is the distilled rule set. Full rules: `CONVENTIONS.md`; canonical code shapes: `EXAMPLES.md`.
- **Token discipline**: never run `pnpm build` / `pnpm lint` / `pnpm stylelint` — Husky pre-commit + CI own them. `pnpm typecheck` is the only verification command. Formatting is automatic (PostToolUse Prettier hook) — never hand-format or re-check style that ESLint/hooks enforce.
- **MCP servers** (`.mcp.json`): `shadcn` (component search/docs/add), `context7` (library docs), `figma` (design-to-code).
- **Skills**: `.agents/skills/` (symlinked into `.claude/skills/`), pinned in `skills-lock.json`. All vendored — never edit in-repo; our own live in `vadimgaidai/agent-skills` (edit there → `npx skills update`). Library skills auto-load into agents via the `skills` frontmatter field.
- **Hooks / rules / examples / scripts / agents**: `.claude/hooks/*.sh`, `.claude/rules/code-style.md`, `examples/*.md`, `scripts/scaffold.sh`, `.claude/agents/*.md` are all master copies from `vadimgaidai/agent-skills` (`hooks/`, `rules/`, `examples/`, `scripts/fsd/`, `agents/fsd/`). They don't auto-update like skills do — edit the master there, then re-copy here. Never author a new hook/rule/example/script/agent directly in this repo; add it to `agent-skills` first.

## Feature pipeline

Full spec, agent table, artifacts contract (`SPEC.md` / `DESIGN.md` / `API.md`), and planning layout: see `AGENTS.md`. Entry points:

| Scenario | Entry |
|---|---|
| New feature | `/analyze-feature` (main-session Q&A → SPEC + issue slices) → full pipeline |
| Bug — logic / data | `@bug-fixer` |
| Bug — markup vs design | `@bug-fixer` (+ Figma frame); whole screen drifted → `@design-analyzer` first |
| New endpoint in existing module | `@api-designer` → `@query-builder` (direct brief) |
| New form in existing feature | `@ui-builder` (direct brief) |
| New screen/component from design | `@design-analyzer` → `@ui-builder` |
| Pre-merge check | `@feature-reviewer` |

Interactive Q&A is main-session-only (`AskUserQuestion` does not surface from subagents) — that's why the entry point is a skill, not an agent. A subagent missing input exits with a report naming what it needs.

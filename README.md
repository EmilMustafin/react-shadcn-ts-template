# React TypeScript FSD Template

![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-000000?style=flat-square&logo=shadcnui&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![FSD](https://img.shields.io/badge/Architecture-FSD-1E40AF?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)

![Claude Code](https://img.shields.io/badge/Claude_Code-6_agents-D77757?style=flat-square&logo=anthropic&logoColor=white)
![Skills](https://img.shields.io/badge/Skills-6_auto--loaded-D77757?style=flat-square)
![MCP](https://img.shields.io/badge/MCP-3_servers-8A4DFF?style=flat-square)
![AGENTS.md](https://img.shields.io/badge/AGENTS.md-spec-2563EB?style=flat-square)
![LLM-ready](https://img.shields.io/badge/LLM--ready-CONVENTIONS_%2B_EXAMPLES-0EA5E9?style=flat-square)

Production-ready React template with [Feature-Sliced Design](https://feature-sliced.design/) and a seven-agent Claude Code pipeline that turns a one-line feature request into reviewed code.

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Requires Node.js ≥ 20, pnpm ≥ 10.

## Agent Pipeline

`/analyze-feature (SPEC + scaffold via scripts/scaffold.sh) → design-analyzer? → api-designer → query-builder → ui-builder → feature-reviewer`

The `/analyze-feature` skill asks focused questions in the main session and writes `.planning/[feature]/SPEC.md`. Every later agent reads that file as the single source of truth, so you don't repeat yourself. (It's a skill rather than an agent because interactive questions don't surface from subagents.)

Start with:

```
/analyze-feature I want to add comments to articles
```

Then in the Claude Code prompt type `@` and pick the next agent — each step prints the next command on completion, copy-paste your way through.

### Pipeline steps

- **/analyze-feature** (skill) — Q&A → writes the SPEC (+ issue slices), then scaffolds the module skeleton via `scripts/scaffold.sh`. No logic code.
- **design-analyzer** — reads Figma via MCP → writes `DESIGN.md` (when the feature has a design).
- **api-designer** — fills `model/types.ts`, `model/constants.ts`, `api/[name].api.ts` from the OpenAPI contract + writes `API.md`.
- **query-builder** — adds `[name].queries.ts` (entities) or `[name].mutations.ts` (features).
- **ui-builder** — the UI layer, branching on form (Zod schema + `Field`/`FieldGroup`) vs non-form (compound components, shadcn wrappers), i18n, dark mode.
- **feature-reviewer** — reviews against the project docs + `examples/*.md`, runs `pnpm typecheck`, offers mechanical auto-fix.

Agent definitions (`.claude/agents/`) are vendored from [vadimgaidai/agent-skills](https://github.com/vadimgaidai/agent-skills) `agents/fsd/` and carry no `model:` pin — subagents inherit the session model.

### Skills (auto-loaded per agent)

`shadcn`, `feature-sliced-design`, `tanstack-query-best-practices`, `react-hook-form-zod`, `vercel-react-best-practices`, `vercel-composition-patterns`.

### Real-time hooks

Run on every Claude `Edit`/`Write` from `.claude/hooks/`:
`fsd-validator.sh` (no upward FSD imports), `kebab-case-validator.sh`, `barrel-import-validator.sh`.

### Token discipline

Agents never run `pnpm build` / `pnpm lint` / `pnpm stylelint` — Husky and CI cover that. The only validation command an agent runs is `pnpm typecheck`.

### Docs the agents read

`CLAUDE.md`, `AGENTS.md`, `CONVENTIONS.md` (rules), `EXAMPLES.md` (canonical code samples).

## Stack

React 19 + TypeScript (strict, React Compiler) · Vite 8 · Tailwind v4 + shadcn/ui (`new-york`) · TanStack Query v5 · React Router v7 · react-i18next · ky · zod + react-hook-form.

## Scripts

- `pnpm dev` — dev server
- `pnpm build` — typecheck + production build
- `pnpm typecheck` — `tsc --noEmit` (preferred verification)
- `pnpm format` — Prettier
- `pnpm preview` — preview production build

(`lint`, `lint:fix`, `stylelint` exist but run automatically via Husky.)

## Project Structure

```
src/
├── app/        # providers, routes, entry
├── pages/      # route-level components
├── widgets/    # complex UI blocks
├── features/   # user interaction scenarios
├── entities/   # business domain models
└── shared/     # ui, lib, config, hooks, types
```

Layer dependency: `app → pages → widgets → features → entities → shared`. Higher layers import lower, never upward.

Full rules in [`CONVENTIONS.md`](./CONVENTIONS.md); reference code in [`EXAMPLES.md`](./EXAMPLES.md).

## Aliases

`@/*` → `src/*` · `~/*` → `public/*`.

## Environment

```env
MODE=development
VITE_APP_NAME=React App
VITE_API_URL=https://api.example.com
VITE_ENABLE_DEVTOOLS=false
```

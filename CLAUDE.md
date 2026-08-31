# CLAUDE.md

React 19 + TS + Vite SPA template on Feature-Sliced Design. Stack and wiring: [`CONVENTIONS.md`](./CONVENTIONS.md).

## Conventions live in plugins, not here

Three plugins from [`claude-kit`](https://github.com/vadimgaidai/claude-kit) own them: `feature-workflow` (plan/implement/review), `react-shadcn-ui` (React 19, shadcn/Tailwind, RHF+Zod), `feature-sliced-design` (layers, module anatomy, scaffolder). `.claude/settings.json` declares them; install once per machine with `/plugin install {feature-workflow,react-shadcn-ui,feature-sliced-design}@vadimgaidai`.

Never restate a plugin rule here, and never author a skill, agent, hook or rule in this repo — edit `claude-kit`.

## Entry points

| Scenario | Entry |
|---|---|
| New feature / entity / widget | `/feature-workflow:analyze`, then `:implement`, then `:review` |
| Building from an existing plan | `/feature-workflow:implement` |
| Pre-merge check | `/feature-workflow:review` |
| A Swagger/OpenAPI contract | `/feature-workflow:api-contract` |
| A new module's folder skeleton | `/feature-sliced-design:structure` (owns `scaffold.sh`) |
| Bug — logic, data, or markup | `@feature-workflow:bug-fixer` |
| Match the app theme to a design | `@react-shadcn-ui:theme-sync` |

`/feature-workflow:analyze` writes one `.planning/[name]/PLAN.md` for the whole request — every module, one file. `/feature-workflow:implement` reads it and builds everything in one pass. Do not fan out layers to subagents.

## Rules for this repo

- **`pnpm typecheck` is the only verification command.** Never `pnpm build` / `lint` / `stylelint`; the pre-commit hook runs them. Prettier runs as a plugin hook; never hand-format.
- **Don't re-check what a machine enforces**: ESLint (`I*`/`T*` prefixes, `enum` ban, `space-y/x-*` ban, `@/shared/ui` barrel ban) and the `feature-sliced-design` hooks (layer placement, kebab-case). Import *direction* is the exception — nothing checks it, so uphold it yourself.
- **Route paths** go in `src/shared/config/routes/paths.ts` — never inline a route string.
- **New page or feature adds its i18n keys** to `src/shared/config/i18n/locales/en/translation.json`, grouped by section.
- **Read env through the exported `env`**, never `import.meta.env`.
- **Query-key segments** are constants in the module's `model/constants.ts`; the factory call lives in `[entity].queries.ts`.
- **`features/auth` uses raw `ky`, not `httpClient`** — deliberate, login/register must not send an auth header. Don't "fix" it.

## Tooling

MCP servers (`.mcp.json`): `shadcn`, `context7`, `figma`. The `shadcn` skill is the one vendored skill left (`npx skills`, pinned in `skills-lock.json`) — don't edit it in place.

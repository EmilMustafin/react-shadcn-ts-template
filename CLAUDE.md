# CLAUDE.md

React 19 + TS + Vite SPA template on Feature-Sliced Design. Stack, scripts, aliases and env variables: [README](./README.md).

## Conventions live in plugins, not here

Workflow commands, agents, convention skills and FSD hooks come from [`react-feature-kit`](https://github.com/vadimgaidai/react-feature-kit) — its README says which command to run when. `.claude/settings.json` declares the plugins; each machine installs them once via `/plugin install`. Never restate a plugin rule here, and never author a skill, agent, hook or rule in this repo — edit `react-feature-kit`. Loaded skill and agent descriptions are the source of truth; when this file and a plugin disagree, the plugin wins.

## Rules for this repo

Everything else — HTTP client internals, query defaults, auth refresh, routing, theming — is readable in `src/shared/`; don't duplicate it here.

- **`pnpm typecheck` is the only verification command.** Never `pnpm build` / `lint` / `stylelint`; git hooks run lint-staged, stylelint, Prettier and commitlint. Never hand-format.
- **Don't re-check what a machine enforces** (ESLint, FSD hooks). Import *direction* is the exception — nothing checks it, so uphold it yourself.
- **`httpClient`** (`src/shared/lib/http/client.ts`) is the only way to call the API. Exception: `features/auth` uses raw `ky` deliberately — login/register must not send an auth header. Don't "fix" it.
- **Route paths** go in `src/shared/config/routes/paths.ts` — never inline a route string.
- **i18n**: a new page or feature adds its keys to `src/shared/config/i18n/locales/en/translation.json`; a new language adds a locale folder **and** registers in `i18n/index.ts`.
- **Env** is read through the exported `env` (`src/shared/config/env/`), never `import.meta.env`.
- **Query-key segments** are constants in the module's `model/constants.ts`; the factory call lives in `[entity].queries.ts`.
- **shadcn/ui**: add with `npx shadcn@latest add …` or the `shadcn` MCP server; don't hand-roll a primitive that already exists in `shared/ui/`.
- **Deletable examples** — `entities/user`, `features/auth`, `widgets/dashboard-layout`, `pages/home` — never cite them as canonical.

## Tooling

MCP servers (`.mcp.json`): `shadcn`, `context7`, `figma`. Vendored skills `shadcn` and `caveman` are pinned in `skills-lock.json` — update with `npx skills`, never edit in place.

## Response style

Default to the `caveman` skill at level `lite`; the skill defines the levels. Files, code, commits, docs and issue text stay normal prose regardless of level.

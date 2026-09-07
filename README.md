# React + TypeScript template (Feature-Sliced Design)

![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-000000?style=flat-square&logo=shadcnui&logoColor=white)
![TanStack Query v5](https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=flat-square&logo=reactquery&logoColor=white)
![React Router v7](https://img.shields.io/badge/React_Router-v7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![FSD](https://img.shields.io/badge/architecture-FSD-1E40AF?style=flat-square)
![MIT](https://img.shields.io/badge/license-MIT-22C55E?style=flat-square)

A starting point for React single-page apps: Vite, strict TypeScript, Tailwind and shadcn/ui, TanStack Query, and [Feature-Sliced Design](https://feature-sliced.design/) for the folder layout.

It's also set up for Claude Code. That part is optional — ignore the `.claude` folder and everything still builds.

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Needs Node 20.19+ and pnpm.

## What you get

- **React 19** with the Compiler on, so you rarely write `useMemo` or `useCallback`.
- **56 shadcn/ui components** already installed in `src/shared/ui/` (`new-york` style).
- **TanStack Query** with a ready client and a query-key factory. If several requests get a 401 at once, the token is refreshed once, not once per request.
- **React Router v7**, pages loaded lazily, plus a protected-route wrapper.
- **Auth that works** — login, register, logout, `useAuth`. Keep it or delete it.
- **i18n** with react-i18next. English only for now.
- **Dark mode** with next-themes, both palettes as CSS variables.
- **Forms** with react-hook-form and zod.
- ESLint, Stylelint, Prettier and commitlint, all run by a pre-commit hook.

## Folders

```
src/
├── app/        providers, routes, entry point
├── pages/      route-level components
├── widgets/    composite UI blocks
├── features/   user-facing scenarios
├── entities/   business domain models
└── shared/     ui, lib, config, hooks, types
```

A layer can import from the layers below it. Never upward, and never sideways between two features.

`entities/user`, `features/auth`, `widgets/dashboard-layout` and `pages/home` are working examples. Delete what you don't need.

## Using it with Claude Code

The plugins come from [react-feature-kit](https://github.com/vadimgaidai/react-feature-kit) — its README explains what they do and which command to run when. `.claude/settings.json` already declares them, but it can't install them for you, so run `/plugin install` once per machine.

Two things about this repo specifically: `pnpm typecheck` is the only check worth running by hand, and import direction is the only rule no tool enforces, so it's a review question.

`.mcp.json` adds three MCP servers: `shadcn`, `context7` and `figma`.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | dev server |
| `pnpm build` | typecheck, then production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm preview` | serve the production build |
| `pnpm format` | Prettier |

`lint` and `stylelint` exist too, but the pre-commit hook runs them.

## Where things are written down

[`CLAUDE.md`](./CLAUDE.md) — how this template is wired (HTTP client, query keys, auth, routing, i18n, env) plus the rules an agent reads. General rules for FSD, React, Tailwind and forms live in the plugins, not here.

## Aliases and env

`@/*` is `src/*`, `~/*` is `public/*`. Both are set in `tsconfig.paths.json` and `vite.config.ts`.

Environment variables are checked with zod in `src/shared/config/env/schema.ts`. Read them from the exported `env`, not from `import.meta.env`.

```env
MODE=development
VITE_APP_NAME=React App
VITE_API_URL=https://api.example.com
VITE_ENABLE_DEVTOOLS=false
```

## License

MIT — except the vendored skills under `.agents/skills/`, which belong to their authors:

- `shadcn` — shadcn's own work, keeps its MIT license in the skill folder.
- `caveman` — Julius Brussee, MIT, from [`JuliusBrussee/caveman`](https://github.com/JuliusBrussee/caveman). Only `skills/caveman/` is vendored here; that path is MIT, while the Engine directories of the upstream repo (`engine/`, `proxy/`, `rewriter/`, `browse/`, `mcp/`, `shrink/`) are BSL-1.1 and are not included.

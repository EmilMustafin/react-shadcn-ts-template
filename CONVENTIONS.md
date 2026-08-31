# CONVENTIONS.md

How this template is wired — the parts you can't infer from a file listing. General rules (FSD, React 19, Tailwind/shadcn, RHF+Zod) live in the [`claude-kit`](https://github.com/vadimgaidai/claude-kit) plugins; agent-facing rules are in [`CLAUDE.md`](./CLAUDE.md); the stack and scripts are in the [README](./README.md).

## Layout

Standard FSD (`app → pages → widgets → features → entities → shared`). Inside `shared/`:

```
assets/       global.css, static files
components/   app-level shared components (page-loader)
config/       env, i18n, routes
hooks/        shared hooks (use-mobile)
lib/          http, react-query, storage, utils
types/        global types (api.types)
ui/           shadcn/ui primitives (~55)
```

`entities/user`, `features/auth`, `widgets/dashboard-layout` and `pages/home` ship as working examples — delete what a real project doesn't need.

## Data layer

`httpClient` (`shared/lib/http/client.ts`) is `ky` with the `VITE_API_URL` base, the Bearer token from `tokenStorage`, a 30s timeout and no retry. It is the only way to call the API — except `features/auth`, which deliberately uses raw `ky` (see CLAUDE.md).

TanStack Query (`shared/lib/react-query/client.ts`): `staleTime` 5 min, `gcTime` 30 min, no refetch on focus, no retry on 4xx. Keys come from `createQueryKeyFactory`.

Auth keeps its token in `localStorage` (`shared/lib/storage/token-storage.ts`) and refreshes on 401 through the global error handlers in `shared/lib/react-query/error-handlers.ts` — concurrent 401s share a single refresh promise, so the retry storm collapses into one call. Protected routes go through `app/routes/protected-route.tsx`.

## Routing, i18n, theming, env

- **Routing** — React Router v7, pages loaded with `React.lazy`.
- **i18n** — `react-i18next` (`shared/config/i18n/`). One locale, `en`. Keys are grouped by section and read with `useTranslation()`: `t("home.welcome.title")`. A new language adds a locale folder **and** registers in `i18n/index.ts`.
- **Theming** — `next-themes`; tokens are CSS variables in `shared/assets/global.css`, light and dark. `@react-shadcn-ui:theme-sync` writes them from a Figma file.
- **Env** — zod-validated in `shared/config/env/schema.ts`; see `.env.example` for the variables.

## shadcn/ui

`components.json` routes components to `shared/ui/`, hooks to `shared/hooks/`, utils to `shared/lib/`. Add with `npx shadcn@latest add …` or the `shadcn` MCP server — don't hand-roll a primitive that already exists.

## What is enforced for you

Husky runs lint-staged + stylelint pre-commit, and commitlint on the message — [Conventional Commits](https://conventionalcommits.org/). What ESLint and the plugin hooks catch (and the one rule nothing catches) is listed in [`CLAUDE.md`](./CLAUDE.md).

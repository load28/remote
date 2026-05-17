# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

This is a polyglot multi-project workspace. The root directory is itself a runnable project, but it also contains ~17 independent sub-projects in sibling directories. Each sub-project has its own toolchain (`package.json`, `Cargo.toml`, `build.gradle.kts`, etc.) and its own dependency tree — **do not run commands from the root expecting them to traverse sub-projects**. Always `cd` into a sub-project before running its scripts.

There is no monorepo orchestration (no workspaces, no Turborepo, no Nx). The root `package.json` only describes the root Module Federation Remote app.

## Root project: Module Federation Remote

The root is a standalone webpack-based Module Federation **Remote** that exposes React components for consumption by host apps.

- Stack: React 19.1.0 + TypeScript + Webpack 5 + `ModuleFederationPlugin`
- Dev server: port **3001** (CORS open for host on `:3000`)
- Container name: `remoteApp` (exposed on `window.remoteApp`)
- Entry: `remoteEntry.js` at `http://localhost:3001/remoteEntry.js`
- Exposed modules: `./Button` → `src/components/Button`, `./Card` → `src/components/Card`

Commands (from repo root):

```
yarn start    # webpack-dev-server, http://localhost:3001
yarn build    # production build to ./dist
```

There is no lint script and no test setup at the root.

### Module Federation conventions (non-obvious)

These are encoded in `webpack.config.js` and `src/index.js` — preserve them when editing:

- **Bootstrap pattern is mandatory.** `src/index.js` does only `import('./bootstrap');` so shared React/ReactDOM can be loaded async before the app boots. Do not move `ReactDOM.createRoot` calls into `index.js`.
- **`output.publicPath` must be an absolute URL** (`http://localhost:3001/`). Remote chunk loading breaks with relative paths.
- **`output.library` is set explicitly** to `{ type: 'var', name: 'remoteApp' }` so the container is exposed on the global scope; do not switch this to UMD/ESM.
- **Do not add `optimization.runtimeChunk`** — it conflicts with the Module Federation container pattern.
- `react` and `react-dom` are declared as `singleton: true` with `eager: false`. Adding new shared deps follows the same shape; bumping React requires updating `requiredVersion` here.

When adding a new exposed component, register it in the `exposes` map in `webpack.config.js` — it is not auto-discovered.

## Sub-projects

Each sub-project directory is self-contained. Common toolchains found here:

- **Next.js + Vitest + Playwright**: `kanban`, `shopping-mall`, `nextjs-streaming-demo`, `transitions-suspense-demo`, `isr-revalidation-demo`, `relay-nextjs-todo`
- **Vite + React 19**: `chat-app`, `load28-react-site`
- **Rust / Cargo**: `blockchain-exchange`
- **Kotlin / Gradle**: `kotlin-todo-server`
- **Other**: `enterprise-push-server`, `headless-calendar`, `react-compiler-cli`, `react-external-store-guide`, `sst-monitoring-dashboard`, `suspense-query-test`, `type-safe-routing`

Before working in a sub-project, read its own `package.json` scripts — they differ. For example, `kanban` exposes `test`, `test:watch`, `test:run`, `test:e2e`, `test:e2e:debug`, `lint`; `chat-app` exposes only `dev`, `build`, `lint`, `test`, `test:watch`.

Some sub-projects ship their own `AGENTS.md` / `CLAUDE.md` (e.g. `transitions-suspense-demo/CLAUDE.md` which references `AGENTS.md`). When entering a sub-project, check for these first — they override generic guidance for that project.

## Skills that auto-apply

The `.claude/skills/` directory holds skills that may trigger automatically based on file type or task:

- **`load28-react`** triggers when creating or modifying **any** React / TSX / JSX file (in the root or any sub-project). It enforces 95 coding rules across architecture, naming, components, state, performance, and testing via a slot-based design protocol — schemas in `.claude/skills/load28-react/schemas/` must be filled in before generating code. Read `.claude/skills/load28-react/SKILL.md` for the protocol. This is not optional when the skill is loaded.
- **`evodev`** and **`superpowers`** are also present; consult their `SKILL.md` when invoked.

## Architectural docs (read before large changes)

These live in `docs/` and `ARCHITECTURE.md` at the root:

- `ARCHITECTURE.md` — design doc for **Nova Framework** (a from-scratch frontend framework concept combining TanStack Router + Preact Signals + class components + Angular-style DI + Qwik resumability). This is a design reference, not implementation — no code in this repo actually implements Nova. Treat it as inspiration / specification text.
- `docs/fsd-architecture/` — Feature-Sliced Design guide for Next.js App Router projects. The `kanban` sub-project follows this layout; new Next.js sub-projects should too.
- `docs/react-testing/` — testing strategy (Vitest + React Testing Library + MSW), test pyramid, FSD-aware patterns, enterprise practices.
- `docs/plans/` and `docs/kanban/` — historical implementation plans.
- `plan.md` (root) — implementation plan for the `load28-react` skill itself.

Most of these docs are written in Korean; respond in Korean when the user does.

## Git / branch conventions

- The repo is hosted at `load28/remote`. GitHub MCP tool access is scoped to this repo only.
- Feature branches use the pattern `claude/<topic>-<suffix>` (e.g. `claude/add-claude-documentation-9jv2M`). Develop on the branch named by the task instructions; do not push to `main` directly.
- Sub-project specific work is committed from the repo root (single git tree spans all sub-projects); scope commits with conventional prefixes seen in `git log`, e.g. `feat(streaming-demo): ...`, `docs: ...`, `chore(rq): ...`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Freeman** is a desktop HTTP client (like Postman/Insomnia) built with Vue 3 + Tauri. The frontend is a Vue 3 SPA; the desktop shell is a Tauri (Rust) app. Package manager is **Bun**.

## Commands

```bash
bun dev           # Start Vite dev server (browser-only, no Tauri shell)
bun run build     # Type-check + production build
bun run type-check # Run vue-tsc type checks
bun lint          # Run oxlint + eslint (both with auto-fix)
bun run format    # Format src/ with oxfmt
bun test:unit     # Run Vitest unit tests with coverage
bun test:e2e      # Run Playwright e2e tests
```

To run a single Vitest test file:

```bash
bunx vitest run src/path/to/test.spec.ts
```

## Architecture

### Data Flow

`HomeView.vue` is the main container. It reads/writes `requestStore` (Pinia) and calls `request.service.ts` on submit.

```
HomeView
├── RequestForm.vue        → URL input + method select, emits submit
├── ObjTable.vue           → Reusable editable key-value table (params, headers)
├── BodyEditor.vue         → Monaco editor wrapper (request + response bodies)
├── ImportCurlDialog.vue   → Parses cURL via curl.service.ts → fills requestStore
└── MenuBar.vue            → Tauri app menu (File > Import cURL)
```

### State Management

`src/stores/request.store.ts` — Pinia composition store, persisted to `localStorage` via `pinia-plugin-persistedstate`. Manages URL, method, params, headers, body, and active tab. **Params ↔ URL are synced bidirectionally** using watchers with a `syncing` guard to prevent loops.

`src/stores/ui.store.ts` — Minimal store for modal state (e.g. `importModalOpen`).

### Services

- `src/services/request.service.ts` — `makeRequest()`: vanilla `fetch` wrapper, returns response headers + body
- `src/services/curl.service.ts` — `parseCurl()`: parses cURL command strings via `sweet-curl-parser`, returns a partial `Request` object

### Types

- `src/types/Request.ts` — `Request` type + `HTTP_METHODS` enum
- `src/types/misc.ts` — `KeyValue`, `ParamRow` (key-value pairs with enabled flag)

### UI Components

`src/components/ui/` contains ShadCN Vue components styled with Tailwind CSS. Prefer composing from these rather than adding new UI dependencies.

### Tauri Integration

`src-tauri/src/lib.rs` sets up the Tauri app (logging plugin). The frontend communicates with Tauri menus via `@tauri-apps/api` event listeners in `App.vue`. Network requests use the browser's native `fetch` (no Tauri IPC for HTTP).

## Linting

Two linters run in sequence: **oxlint** first (Rust-based, fast), then **eslint**. Both are configured to auto-fix. Husky + lint-staged run `bun lint` on staged files pre-commit.

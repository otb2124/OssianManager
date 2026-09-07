# Ossian Manager

Ossian Manager is the desktop editor/tooling shell for the **OssianForge** game engine. It's an Angular + Tauri (Rust) application that provides project management, a data-driven inspector, and 2D/3D scene viewports, and it embeds the compiled OssianForge engine executable directly inside its window as a live viewport.

## How It Works

- The **frontend** is an Angular 20 single-page app (standalone components, signals, lazy-loaded routes) styled with Tailwind CSS and PrimeNG.
- The **backend** is a Rust Tauri 2 app that exposes commands to the frontend for filesystem access, project scanning, Git info, and directory operations.
- A dedicated **engine host module** (`engine_host.rs`) spawns the OssianForge C# engine as a child process (`OssianEngine.exe --embedded`) and, on Windows, reparents its native window (via Win32 APIs) into the Tauri window as a borderless child viewport — keeping it positioned and sized in sync with an Angular viewport panel as the user resizes or moves it.

This lets the Angular UI act as a full editor around the actual engine renderer, rather than reimplementing rendering in the web view.

## Features

- **Project management** — create, scan, import, and track recent projects, backed by a local project registry (`project-registry.json`) and per-project config (`.ossian.project.json`).
- **Embedded engine viewport** — launches and controls the real OssianForge engine process as a 3D/2D viewport panel inside the editor window.
- **Inspector / field system** — a generic, config-driven property inspector built from reusable field controls: boolean, number, text, vector, color picker, select, tree select, tag select, accordion, editable table, image select, resource picker, and URL controls.
- **Hierarchy & file browsing** — a scene hierarchy panel and a file tree/explorer panel for navigating project content.
- **Script editor** — an in-app code editor built on CodeMirror 6, with C# and JSON language support, autocomplete, search, and a one-dark theme.
- **Settings system** — structured settings pages for engine, display (window/accessibility/rendering/cursor/physics), input (keys/axis/controllers), events (actions/conditions/state machines/pronouns), and language/localization.
- **Command/menu system** — a File/Edit/View/Tools/Project/Build menu structure with routed actions and keyboard shortcuts (e.g. `Ctrl+S` to save, `Ctrl+Shift+E` to toggle the file explorer).
- **Notifications & logging** — an in-app notification log and a dedicated logs page.
- **Git integration** — reads the latest commit (hash, message, author, date, branch) for the project repo via a Rust `git` command wrapper.
- **Theming** — a theme service for light/dark or custom editor themes.
- **Tag system** — user-defined tags for organizing projects.

## Tech Stack

**Frontend**
- Angular 20 (standalone components, Router, CDK, RxJS)
- PrimeNG 20 + PrimeIcons (UI components)
- Tailwind CSS 4 (+ `tailwindcss-primeui`)
- CodeMirror 6 (script editor, with C# language support via `@replit/codemirror-lang-csharp`)
- TypeScript 5.8
- Vite (dev tooling, used by the Angular builder)

**Backend / Shell**
- Tauri 2 (Rust)
- `tauri-plugin-fs`, `tauri-plugin-dialog`, `tauri-plugin-opener`
- `serde` / `serde_json` for data interchange with the frontend
- `winapi` (Windows-only) for native window embedding of the engine process

## Project Structure

```
OssianManager/
├── src/
│   ├── app/
│   │   ├── components/           # Shared UI: shell, topbar, sidebar-nav, menu-nav, tabs,
│   │   │                          # dialogs, viewport2d/viewport3d, field-controls/*, etc.
│   │   ├── pages/                 # Routed pages: projects, settings, libraries, logs, scene
│   │   ├── model/                 # TypeScript models: project, engine config, node config,
│   │   │                          # fields config, git, notifications, app config
│   │   ├── services/
│   │   │   ├── data/               # Project, app-config, engine-config, user-tags services
│   │   │   ├── engine/              # EngineBridgeService (Tauri invoke wrapper for the engine)
│   │   │   ├── git/                 # GitService
│   │   │   ├── notifications/       # NotificationService
│   │   │   ├── persistence/         # File I/O, dialogs, file explorer
│   │   │   ├── routes/              # Route/sidebar-nav helpers
│   │   │   ├── system/              # Action registry, context menu, key shortcuts
│   │   │   └── ui/                  # Dialog-form and dynamic fields services
│   │   ├── app.routes.ts          # Full editor menu/route tree
│   │   └── app.config.ts
│   └── main.ts
├── src-tauri/
│   ├── src/
│   │   ├── main.rs                # Entry point
│   │   ├── lib.rs                 # Tauri commands: fs ops, git info, project scanning, etc.
│   │   └── engine_host.rs         # Spawns & embeds the OssianForge engine window (Windows)
│   ├── capabilities/               # Tauri permission manifests
│   ├── Cargo.toml
│   └── tauri.conf.json
├── angular.json
├── package.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS) and npm
- [Rust](https://www.rust-lang.org/tools/install) + Cargo
- [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS (on Windows: WebView2, MSVC build tools)
- A built copy of the **OssianForge** engine (`OssianEngine.exe`) if you want the embedded viewport to work — the expected path is configured in `EngineBridgeService`

### Install & Run (development)

```bash
npm install
npm run tauri dev
```

This starts the Angular dev server (`http://localhost:1420`) and launches the Tauri window, which loads the dev server and can spawn the engine process.

### Build (production)

```bash
npm run tauri build
```

This runs `ng build`, then packages the Angular output (`dist/ossian-manager/browser`) together with the compiled Rust binary into a native installer/executable for your platform.

> **Note:** native window embedding of the engine (in `engine_host.rs`) is currently implemented for **Windows** only.

## License

TBC

# Architecture Overview

## What is the Virtual Data Room?

The Virtual Data Room (VDR) is a React single-page application that provides a structured, hierarchical storage system for documents and links. Content is organised into **Sections → Subsections → Documents/Links**, and the application exposes document versioning, status tracking, audit logs, full-text search, and a soft-delete (trash/restore) workflow.

The front end communicates entirely through a custom REST API hosted on the **Twinit platform** (via Twinit's OMAPI gateway). There is no separate back-end server for this project — all persistence and business logic lives inside Twinit backend scripts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 |
| Build tool | Vite 8 |
| Routing | React Router v7 |
| Server-state / caching | TanStack React Query v5 |
| Platform SDK | `@dtplatform/platform-api` ~5.1 |
| Document viewer | `@dtplatform/iaf-doc-viewer` ~5.1 |
| Styling | Plain CSS modules (per-component `.css` files) |
| Linting | ESLint 9 |

---

## Project Structure

```
Twinit-App-Template-Virtual-Data-Room/
├── docs/                         ← this documentation
├── setup/
│   └── template-package-content/
│       ├── omapiConfig/
│       │   └── VDR-API.json      ← OMAPI endpoint routing configuration
│       ├── scripts/
│       │   ├── sections-api.mjs  ← backend: sections, subsections, links logic
│       │   ├── documents-api.mjs ← backend: document status, versions, trash
│       │   ├── search-api.mjs    ← backend: full-text search and trash search
│       │   └── users-api.mjs     ← backend: role resolution, group listing, invitations
│       ├── custom/
│       │   └── custom-setup.mjs  ← Twinit project bootstrap script
│       └── manifest.json
└── src/
    ├── App.jsx                   ← root component, auth bootstrap, routing
    ├── main.jsx                  ← React entry point
    ├── auth/
    │   └── auth.js               ← OAuth PKCE helpers
    ├── context/
    │   ├── ProjectContext.jsx    ← active Twinit project / room picker
    │   ├── UserContext.jsx       ← authenticated user profile
    │   └── SearchHighlightContext.jsx ← spotlight + navigating state for search navigation
    ├── services/
│   ├── apiFetch.js           ← fetch wrapper with 401 detection
│   ├── useSections.js        ← section CRUD + trash hooks
│   ├── useSubsections.js     ← subsection, link CRUD + trash hooks
│   ├── useDocuments.js       ← document upload, status, versions, trash hooks
│   ├── useSearch.js          ← search and trash-search hooks
│   └── useUsers.js           ← user profile, roles, group listing, invite hooks
    ├── pages/
│   ├── VirtualDataRoom.jsx   ← main room view; LazySection wrappers + NavigationToast; toolbar gated by room_admin
│   ├── TrashBin.jsx          ← trash view (restore / permanently delete); room_admin only
│   └── ManageUsers.jsx       ← user management: group viewer + invite dialog; room_admin only
    └── components/               ← UI components (see Component Reference)
```

---

## Layered Architecture

```
┌───────────────────────────────────────────────────┐
│                   React UI Layer                  │
│  Pages: VirtualDataRoom · TrashBin · ManageUsers  │
│  Components: SectionCard · SubsectionRow · …      │
└────────────────────┬──────────────────────────────┘
                     │ reads / writes via
┌────────────────────▼──────────────────────────────┐
│             Service / Hooks Layer                 │
│  useSections · useSubsections · useDocuments      │
│  useSearch  (all built on React Query)            │
└────────────────────┬──────────────────────────────┘
                     │ HTTP via apiFetch()
┌────────────────────▼──────────────────────────────┐
│          Twinit OMAPI Gateway  (/omapi/{ns}/…)    │
│  VDR-API.json routes requests to backend scripts  │
│  sections-api · documents-api · search-api        │
└────────────────────┬──────────────────────────────┘
                     │
┌────────────────────▼──────────────────────────────┐
│           Twinit Platform Services                │
│  IafItemSvc (items) · IafFileSvc (files)          │
│  IafPassSvc (auth) · IafWorkspace / IafProj       │
└───────────────────────────────────────────────────┘
```

---

## Key Design Decisions

**React Query for all server state** — there is no Redux or Zustand. Every piece of data from the API is owned by a React Query cache entry and invalidated after mutations. This keeps components simple: they call a `useXxx` hook and get back `{ data, isLoading, error }`.

**No optimistic updates** — mutations wait for server confirmation before invalidating queries and re-fetching. This keeps the UI consistent with the backend, at the cost of a brief loading indicator after each write.

**Soft-delete pattern** — nothing is permanently deleted from the UI until the user explicitly confirms in the Trash Bin. Moving to trash and restoring from trash are separate API calls (`/trash` and `/untrash`). Permanent deletion is a `DELETE` request.

**OMAPI as the API layer** — the front end never calls Twinit's internal services directly (except for auth and file upload). All domain endpoints go through the OMAPI gateway, which dispatches to the appropriate backend script. This means the API contract is defined in `VDR-API.json` and the scripts in `setup/template-package-content/scripts/`.

---

## Application Bootstrap Sequence

1. `main.jsx` mounts `<App />` inside a `QueryClientProvider`
2. `App.jsx` calls `IafSession.setConfig()` to point the platform SDK at the correct API endpoint
3. Auth is checked — if no token exists, `initiateAuth()` redirects to Twinit's OAuth authorise endpoint
4. On return from OAuth, `handleAuthCallback()` exchanges the code for an access token (PKCE)
5. `IafSession.setAuthToken()` is called so the platform SDK can also make authenticated calls
6. `UserProvider` calls `useGetMe()` which hits `GET /users/me` to fetch the current user profile and compute the `roles` object (room admin flag or per-section role names)
7. `ProjectProvider` fetches the list of Twinit workspaces; if more than one exists the user selects a Room
8. Once a project is selected, `IafProj.switchProject()` sets the active project context in the SDK
9. The main `VirtualDataRoom` page renders and loads sections via `useSections()`

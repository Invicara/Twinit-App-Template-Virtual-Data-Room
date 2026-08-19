# Component Reference

This document describes the role of each component and how they relate to each other.

---

## Page Components (`src/pages/`)

### `VirtualDataRoom.jsx`

The main application view. Renders a toolbar (search bar, "New Section" button, hamburger menu) followed by a list of `LazySection` wrappers. Wraps the content in a `SearchHighlightProvider` so that search navigation can highlight results anywhere in the tree.

If no sections exist, renders an empty state with a "Create Your First Section" button.

**Role-based restrictions:**
- The **New Section** button and **HamburgerMenu** are only rendered when `roles.room_admin === true`

**Key sub-components:**

- `HamburgerMenu` — a dropdown that links to the Manage Users page and the Trash Bin. Only visible to Room Admins.
- `LazySection` — see below.
- `NavigationToast` — see below.

#### `LazySection`

A wrapper component rendered in place of each `SectionCard`. It defers both the mount of `SectionCard` and the subsection API fetch until the section actually needs to be shown, preventing the browser from firing dozens of parallel requests on initial page load.

**Behaviour:**
1. Renders a styled card shell (identical header — section number, name, role badge) as a placeholder while the section is off-screen or loading.
2. Uses an `IntersectionObserver` to detect when the placeholder enters the viewport. Once visible, it starts fetching subsections via `useSubsections` while the placeholder remains visible.
3. Only mounts the real `SectionCard` after subsections have finished loading, so the card appears at its full height in one step and does not cause a layout cascade that would pull more off-screen placeholders into view.
4. If a search `spotlight` targets this section before it has scrolled into view, `isVisible` is forced to `true` immediately so the section loads in response to the search action.
5. Clears the `navigating` flag in `SearchHighlightContext` once the section is ready.

#### `NavigationToast`

A small fixed toast (bottom-centre of the viewport) that appears while `navigating` is `true` in `SearchHighlightContext`. Shows a spinner and "Navigating to **[Section Name]**…" to reassure the user that a search click is being acted on when the target section needs to load first. Disappears automatically once the target section is ready.

### `TrashBin.jsx`

Displays all trashed items grouped into four tables: Sections, Subsections, Documents, and Links. Each item can be restored or permanently deleted.

- Uses `useTrash()` to load all trashed items in a single API call
- Permanent deletion triggers a `DeleteConfirmDialog` with a warning that the action cannot be undone
- Deleting a section or subsection cascades to all child items
- **On mount**, checks `roles.room_admin`. If the user is not a Room Admin, immediately redirects to `/` via `useNavigate` (with `replace: true` so the browser back button does not return to this page)

### `ManageUsers.jsx`

The user management page, accessible only to Room Admins.

- **On mount**, checks `roles.room_admin`. If the user is not a Room Admin, immediately redirects to `/`
- Loads all user groups for the project via `useUserGroups()` (which now includes pending invites per group)
- Loads all sections via `useSections()`
- Displays a **Room Admin** block at the top, followed by one block per section showing that section's three groups (Section Admin, Contributor, Viewer)
- Each group row (`GroupRow`) is expandable; expanding it loads and lists the users in that group via `useGroupUsers()`
- The **+ Invite User** button opens `InviteUserDialog`

#### `GroupRow`

The expandable row component for a single user group. When expanded it renders:

**User table** — lists each user with first name, last name, email, and two action buttons:
- **Remove from this group** (trash icon) — calls `useRemoveUserFromGroup()` with `{ groupId, userId }`. Disabled for the currently signed-in user.
- **Remove from all groups** (circle-X icon) — calls `useRemoveUserFromAllGroups()` with `{ userId }`. Removes the user from every group in the project. Disabled for the currently signed-in user.

Both buttons show an inline `<Spinner>` while their mutation is pending and display an error message below the table if the mutation fails.

**Pending Invites table** — rendered below the user list when `group.invites` is non-empty. Columns: Email, Status (colour-coded pill), Expires. Each row has a trash button that calls `useCancelInvite()` with `{ groupId, inviteId }`. Only invitations with `status === 'PENDING'` show an active cancel button; expired/rejected rows are informational.

#### `InviteUserDialog`

A modal form that collects:
- **Existing user picker** — if `useGetAllUsers()` returns data, a `<select>` lists all current project users by name. Selecting one pre-fills the email field; clearing the field resets the selection.
- **Email address** — free-text input; must be a valid email format before submission.
- **Room Admin** checkbox — if checked, the user is invited to the Room Admin group only; section role selects are disabled
- **Section roles** — one dropdown per section, allowing the inviter to assign Section Admin, Section Contributor, Section Viewer, or no access for each section

On submit, calls `useInviteUsers()` which sends one invitation email per group assignment. Each email is customised with the project name and section name.

---

## Layout Components

### `Header.jsx`

The application header, rendered on every page. Shows:
- Twinit logo
- Current room name
- User avatar (initials), full name, and a dropdown menu with:
  - **My Profile** — links to Twinit account settings
  - **Switch Room** — clears the project selection and shows the Room Picker
  - **Logout**
  - App version number

---

## Core UI Components

### `SectionCard.jsx`

Renders a single section and the table of its subsections. Manages the expand/collapse state for each subsection row. Handles the "Expand All / Collapse All" toggle.

Only mounted by `LazySection` after subsections have been fetched, so it always renders with data already in the React Query cache.

Reacts to `spotlight` changes from `SearchHighlightContext` — if a search result is in this section, the relevant subsection is automatically expanded.

**Role-based restrictions (reads `roles` from `UserContext`):**
- The **section edit (pencil) button** is disabled (`disabled` attribute) when `roles.room_admin` is not `true`. The button remains visible but is dimmed and non-interactive.
- The **New Subsection** footer button is only rendered when the user's section role is not `'Section Viewer'` or `'Section Contributor'` (i.e. Section Admins and Room Admins see it).
- A **role badge** is displayed in the section header whenever the user has a role for that section. Room Admins see `"Room Admin"`; section-scoped users see their role (`"Section Admin"`, `"Section Contributor"`, or `"Section Viewer"`). Users with no role in the section see no badge.

**Section Admins popup:**

When `section.groups.admin` is present, a people icon button is rendered next to the role badge for Room Admins. Clicking it opens a modal popup listing the first and last names of all users in the section's admin group.

- Uses `useGroupUsers(groupId)` from `useUsers.js`, passing `section.groups.admin` as the group ID
- The query is kept disabled (`groupId` passed as `null`) until the popup is opened, so no network request is made until the user clicks the icon
- The popup is dismissed by clicking outside it (backdrop click handler calls `setShowAdminsPopup(false)`; `stopPropagation` on the inner card prevents accidental close)
- Shows a `Spinner` while loading and a fallback message if no admins are found
- User display name is derived from `_firstname`/`firstname` and `_lastname`/`lastname` fields, falling back to email then `_id`

### `SubsectionRow.jsx`

A table row for a single subsection. Collapsed by default; expanding it reveals:
- A **document upload drop zone** (drag-and-drop or click-to-browse)
- The **document table** (`DocumentTable`)
- A **link creation form**
- The **link table**

Handles all link interactions inline: add, edit status, edit details, view history, trash.

Also reacts to `spotlight` changes — if the spotlight points to a link in this subsection, the page scrolls to that link row and plays a highlight animation.

**Role-based restrictions (reads `roles` from `UserContext`):**

The component derives two flags from the user's role for this section (`roles[section._id]`):

- `isViewer` — `true` when role is `'Section Viewer'`
- `canChangeStatus` — `true` when role is neither `'Section Viewer'` nor `'Section Contributor'`

| UI element | Behaviour for restricted roles |
|---|---|
| **Subsection edit button** | Disabled (dimmed) for Viewers and Contributors |
| **File upload drop zone** | Replaced with an invisible placeholder div for Viewers (maintains grid layout) |
| **Link creation form** | Replaced with an invisible placeholder div for Viewers |
| **Document status pill** | Read-only (no `<select>`) for Viewers and Contributors |
| **Link status pill** | Read-only (no `<select>`) for Viewers and Contributors |
| **Document trash button** | Disabled (dimmed) for Viewers |
| **Link trash button** | Disabled (dimmed) for Viewers |
| **Link edit button** | Disabled (dimmed) for Viewers |

Invisible placeholders use `visibility: hidden; pointer-events: none` so that the two-column grid layout (`1fr 2fr`) remains the same width for all users.

### `DocumentTable.jsx`

Renders the list of documents in an expanded subsection. Manages the in-line document viewer, status change flow, and trash flow. Each row is a `DocumentRow`.

Accepts two role-control props passed down from `SubsectionRow`:
- `canChangeStatus` — when `false`, passes `statusDisabled={true}` to each `DocumentRow`, making status pills read-only
- `canTrash` — when `false`, passes `onTrash={undefined}` to each `DocumentRow`, disabling the trash button

### `DocumentRow.jsx`

A single document row. Displays name, version number, status pill, and action buttons (view, version history, download, trash). When in the Trash Bin, also shows restore and permanent-delete buttons.

- When `onTrash` is `undefined`, the trash button renders as disabled (dimmed, `not-allowed` cursor) rather than hidden, preserving column alignment
- When `statusDisabled` is `true`, the `StatusPill` renders as a read-only badge

---

## Dialog Components

All dialogs are modal overlays. They accept `onClose` / `onConfirm` / `onCancel` props and do not manage their own open/close state — the parent component controls visibility.

| Component | Triggered by | Purpose |
|---|---|---|
| `CreateSectionDialog` | "New Section" button | Form to create a section with number and name |
| `EditSectionDialog` | Section edit (pencil) button | Edit section number and name |
| `CreateSubsectionDialog` | "New Subsection" button | Form to create a subsection |
| `EditSubsectionDialog` | Subsection edit button | Edit subsection number, name, and description |
| `EditLinkDialog` | Link edit button | Edit link name, description, and URL |
| `TrashDocumentDialog` | Document trash button | Confirmation before moving a document to trash |
| `TrashLinkDialog` | Link trash button | Confirmation before moving a link to trash |
| `DeleteConfirmDialog` | Permanent delete button (Trash Bin) | Generic "are you sure?" dialog for irreversible deletes |
| `StatusNoteDialog` | Status pill change (documents & links) | Optionally capture a note when changing status |
| `VersionLogsDialog` | Document version history button | Shows all versions and status log entries |
| `LinkLogsDialog` | Link history button | Shows all status change log entries for a link |

---

## Status Components

### `StatusPill.jsx`

Renders a coloured badge for a status value. Has two modes:
- **Read-only** — displays the status text as a non-interactive badge (rendered when `onChange` or `options` is not provided)
- **Interactive** — renders a `<select>` element styled as a pill, allowing the user to change the status (rendered when both `onChange` and `options` are provided)

The interactive mode is suppressed for Section Viewers and Contributors by simply not passing `onChange`/`options` from `SubsectionRow` and `DocumentTable`.

Colour mappings:
- `"Approved"` → green
- `"Rejected"` → red
- `"For Review"` → yellow/amber
- Any other / no value → neutral grey (`—`)

### `SubsectionStatusBar.jsx`

A proportional horizontal bar showing the distribution of document/link statuses within a subsection. Fetches its data via `useSubsectionStatus`.

---

## Utility Components

### `SearchBar.jsx`

Debounced (300 ms) search input. As the user types, fires `useSearch()` and shows a dropdown of matching documents and links. Clicking a result sets `navigating: true` and the `spotlight` in `SearchHighlightContext`. `LazySection` reacts to the spotlight to load the target section if needed, and clears `navigating` once ready. `SectionCard` then expands the correct subsection and `SubsectionRow` scrolls to and highlights the matching item.

### `Button.jsx`

Styled primary button. Accepts all standard button props.

### `CancelButton.jsx`

Styled secondary/cancel button.

### `TrashButton.jsx`

Icon button variant used to trigger trash actions in the main room view.

### `Spinner.jsx`

Animated loading spinner. Used inline alongside loading text in many components.

---

## Context Providers

### `UserContext.jsx` / `useUser()`

Loads and exposes the current user's profile and role assignments by calling `useGetMe()` (which hits `GET /users/me`). Provides:

```js
{ user, roles, userLoading }
```

The `roles` object shape:

```js
// Room Admin
{ room_admin: true }

// Section-scoped user
{ "<sectionId>": "Section Admin" | "Section Contributor" | "Section Viewer" }
```

Components that need to enforce role-based UI call `useUser()` and read from `roles` directly. The redirect guard in `TrashBin` and `ManageUsers` waits for `userLoading` to be `false` before checking `roles.room_admin`, to avoid false redirects during initial load.

### `ProjectContext.jsx` / `useProject()`

Manages the selected Twinit project (Room). On mount, loads the list of projects the user belongs to. If none is cached in `sessionStorage`, shows the **Room Picker** overlay.

After selection, calls `IafProj.switchProject()` and caches the selection. Provides `{ project, clearProject }`.

### `SearchHighlightContext.jsx` / `useSearchHighlight()`

Holds two pieces of search navigation state:

**`spotlight`** — describes the currently selected search result:

```js
{ type: 'document'|'link', sectionId, subsectionId, itemId }
```

When `spotlight` is set, `LazySection` loads the target section if it hasn't been loaded yet, `SectionCard` expands the relevant subsection, and `SubsectionRow` scrolls to and animates the matching row. After the animation ends, `spotlight` is cleared via `setSpotlight(null)`.

**`navigating`** — a boolean flag set to `true` by `SearchBar` when a result is clicked and cleared to `false` by `LazySection` once the target section's subsections have loaded. `NavigationToast` renders while this flag is `true`.

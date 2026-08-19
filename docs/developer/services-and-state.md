# Services & State Management

All server state in the VDR is managed by **TanStack React Query v5**. There is no global client-side state store (no Redux, no Zustand). Components read data via query hooks and trigger mutations via mutation hooks.

---

## apiFetch

**`src/services/apiFetch.js`**

A thin wrapper around the native `fetch` API that:
1. Awaits the response and throws `Error('HTTP error! status: …')` for non-OK responses
2. Inspects the response body for an application-level 401 (`errorResult.status === 401`) — even when the HTTP status is 200 — and fires a `session-expired` CustomEvent on the shared `authEvents` EventTarget
3. Returns the parsed JSON on success

All service hooks use `apiFetch` rather than `fetch` directly.

---

## QueryClient Configuration

Defined in `App.jsx`:

```js
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
})
```

`refetchOnWindowFocus` is disabled to avoid unexpected re-fetches when users switch browser tabs.

---

## Query Key Conventions

Query keys are arrays that scope data by namespace (project) and by the IDs of the resources involved:

| Hook | Query Key |
|---|---|
| `useSections` | `['sections', namespace, { trash }]` |
| `useSubsections` | `['subsections', namespace, sectionId]` |
| `useSubsectionStatus` | `['subsectionStatus', namespace, sectionId, subsectionId]` |
| `useDocuments` | `['documents', namespace, sectionId, subsectionId]` |
| `useDocumentStatuses` | `['documentStatuses', namespace]` |
| `useDocumentVersions` | `['documentVersions', fileId]` |
| `useDocumentLogs` | `['documentLogs', namespace, fileId, versionId]` |
| `useLinks` | `['links', namespace, sectionId, subsectionId]` |
| `useLinkLogs` | `['linkLogs', namespace, sectionId, subsectionId, linkId]` |
| `useSearch` | `['search', namespace, query, params]` |
| `useTrash` | `['searchTrash', namespace]` |
| `useGetMe` | `['users', 'me']` |
| `useGetAllUsers` | `['users', 'all']` |
| `useUserGroups` | `['users', 'groups']` |
| `useGroupUsers` | `['users', 'groups', groupId, 'users']` |

---

## Cache Invalidation Strategy

After every mutation, the relevant query keys are invalidated, causing React Query to re-fetch the affected data. The pattern is intentionally broad — invalidating at the top-level key rather than trying to surgically update the cache — to keep the code simple and ensure the UI always reflects backend state.

### Examples

**After creating a section:**
- Invalidates `['sections']` → re-fetches the full section list

**After uploading documents:**
- Invalidates `['documents', namespace, sectionId, subsectionId]` → re-fetches the subsection's document list
- Invalidates `['subsectionStatus', namespace, sectionId, subsectionId]` → re-fetches the status summary bar
- Invalidates `['documentVersions', uploadedFileId]` for each uploaded file

**After trashing a link:**
- Invalidates `['links', namespace, sectionId, subsectionId]`
- Invalidates `['subsectionStatus', namespace, sectionId, subsectionId]`

**After restoring from trash (untrash):**
- Invalidates the relevant resource list AND `['searchTrash']` so the Trash Bin updates

---

## Service Hooks Reference

### `useSections.js`

| Export | Type | Description |
|---|---|---|
| `useSections({ trash? })` | Query | Fetch all sections; pass `{ trash: true }` for trashed items |
| `useCreateSection()` | Mutation | Create a section |
| `useUpdateSection()` | Mutation | Edit a section's number and name |
| `useTrashSection()` | Mutation | Move a section to trash |
| `useUntrashSection()` | Mutation | Restore a section from trash |
| `useDeleteSection()` | Mutation | Permanently delete a section |

### `useSubsections.js`

| Export | Type | Description |
|---|---|---|
| `useSubsections(sectionId, { enabled? })` | Query | Fetch subsections for a section; pass `{ enabled: false }` to defer the fetch |
| `useSubsectionStatus(sectionId, subsectionId)` | Query | Fetch status counts for a subsection |
| `useCreateSubsection()` | Mutation | Create a subsection |
| `useUpdateSubsection()` | Mutation | Edit a subsection |
| `useTrashSubsection()` | Mutation | Move to trash |
| `useUntrashSubsection()` | Mutation | Restore from trash |
| `useDeleteSubsection()` | Mutation | Permanently delete |
| `useLinks(sectionId, subsectionId, { enabled? })` | Query | Fetch links for a subsection |
| `useCreateLink()` | Mutation | Add a link |
| `useUpdateLink()` | Mutation | Edit link name/description/URL |
| `useUpdateLinkStatus()` | Mutation | Change link status |
| `useLinkLogs(sectionId, subsectionId, linkId, { enabled? })` | Query | Fetch link status log |
| `useTrashLink()` | Mutation | Move link to trash |
| `useUntrashLink()` | Mutation | Restore link from trash |
| `useDeleteLink()` | Mutation | Permanently delete link |

### `useDocuments.js`

| Export | Type | Description |
|---|---|---|
| `useDocuments(sectionId, subsectionId, { enabled? })` | Query | Fetch documents in a subsection |
| `useDocumentStatuses()` | Query | Fetch valid status values (`staleTime: Infinity`) |
| `useDocumentLogs(fileId, versionId)` | Query | Fetch status log for a document version |
| `useDocumentVersions(fileId, { enabled? })` | Query | Fetch all versions of a document |
| `useUploadDocuments(sectionId, subsectionId, folderId)` | Mutation | Upload files (max 3 concurrent) |
| `useUpdateDocumentStatus(sectionId, subsectionId)` | Mutation | Change document status |
| `useTrashDocument()` | Mutation | Move document to trash |
| `useUntrashDocument()` | Mutation | Restore document from trash |
| `useDeleteDocument()` | Mutation | Permanently delete document |

### `useSearch.js`

| Export | Type | Description |
|---|---|---|
| `useSearch(query, params?)` | Query | Full-text search; only fires when `query` is non-empty |
| `useTrash()` | Query | Fetch all trashed items across sections/subsections/documents/links |

### `useUsers.js`

| Export | Type | Query Key | Description |
|---|---|---|---|
| `useGetMe()` | Query | `['users', 'me']` | Fetches the current user's profile and computed `roles` object. `staleTime: 60 minutes`. Used by `UserContext` on mount. |
| `useGetAllUsers()` | Query | `['users', 'all']` | Fetches a deduplicated, sorted list of all users in the project. `staleTime: 5 minutes`. Used by `InviteUserDialog` to populate the existing-user dropdown. |
| `useUserGroups()` | Query | `['users', 'groups']` | Fetches all user groups scoped to the current project, including `invites` arrays for each group. Used by `ManageUsers`. |
| `useGroupUsers(groupId)` | Query | `['users', 'groups', groupId, 'users']` | Fetches users in a specific group. Only enabled when `groupId` is truthy (lazy — called when a group row is expanded). |
| `useInviteUsers()` | Mutation | — | Sends invitation emails to a user for one or more group assignments. |
| `useRemoveUserFromGroup()` | Mutation | — | Removes a user from a single group. On success, invalidates `['users', 'groups', groupId, 'users']`. |
| `useRemoveUserFromAllGroups()` | Mutation | — | Removes a user from every group in the project. On success, invalidates `['users', 'groups']`. |
| `useCancelInvite()` | Mutation | — | Cancels a pending group invitation. On success, invalidates `['users', 'groups']` so the invite is removed from the UI. |

---

## Lazy Loading Pattern

The app defers API fetches at two levels to avoid loading data the user has not yet scrolled to.

### Section level — `LazySection`

Each section in `VirtualDataRoom` is wrapped in a `LazySection` component. Subsections are **not** fetched until the section's placeholder enters the viewport (detected via `IntersectionObserver`). `useSubsections` accepts an `{ enabled }` option for this purpose:

```js
const { isLoading } = useSubsections(section._id, { enabled: isVisible })
```

`SectionCard` is only mounted after the fetch completes, so it always renders at its final height and does not trigger a layout cascade that would pull more off-screen sections into view.

When a search result targets an off-screen section, `LazySection` forces `isVisible = true` immediately so the section loads in response to the navigation.

### Subsection level — documents and links

Subsection documents and links are only fetched when the subsection row is **expanded**. Both `useDocuments` and `useLinks` accept an `{ enabled }` option:

```js
const { data: documents } = useDocuments(section._id, subsection._id, { enabled: expanded })
const { data: links }     = useLinks(section._id, subsection._id, { enabled: expanded })
```

This avoids loading the full document/link tree when the user only needs the section/subsection overview.

Similarly, `useDocumentVersions` defaults to `enabled: false` and is only activated when the user opens the version log dialog.

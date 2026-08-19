# Permissions & Access Control

Every section in the VDR has its own set of three **user groups** that are created automatically when the section is created. This gives administrators fine-grained control over who can access and modify the content within each section.

---

## User Group Model

```
Room
└── Room Admin  (one group for the whole Room)
└── Section (per section)
    ├── Section Admin
    ├── Section Contributor
    └── Section Viewer
```

The three section-scoped groups are created by `_createSectionUserGroups()` which is called at the end of `createSection`. Each group stores the section's `_id` and the project workspace reference in its `_userAttributes` field, so they can be queried and filtered by project.

| Group | `_shortName` | `_userAttributes` |
|---|---|---|
| Section Admin | `sectionadmin` | `{ section: <sectionId>, project_workspace: { _id, _namespaces } }` |
| Section Contributor | `sectioncont` | `{ section: <sectionId>, project_workspace: { _id, _namespaces } }` |
| Section Viewer | `sectionview` | `{ section: <sectionId>, project_workspace: { _id, _namespaces } }` |

> **Important:** The `project_workspace` field in `_userAttributes` is required. The `users-api.mjs` script filters groups by `project_workspace._id` to isolate groups belonging to the current project. Groups created before this field was added will not appear in the Manage Users page or in user role resolution.

---

## Permission Sets

### Passport Service Permissions

| Who gets it | Resource | Actions | Effect |
|---|---|---|---|
| Room Admin | Each new section group | `*` | Room Admin can manage membership of all three section groups |
| All section groups | All workspaces (`passportsvc:workspace:*`) | `READ` | Members can log in and see the Room |

### File Service Permissions

Permissions are set on the section's file service folder (`filesvc:file:{section.folderId}`). Because subsection folders are children of the section folder, this permission applies transitively to all documents within the section.

| Group | Actions |
|---|---|
| Section Admin | `*` (all — read, create, edit, delete) |
| Section Contributor | `READ`, `CREATE`, `EDIT` |
| Section Viewer | `READ` |

### Item Service Permissions

All permissions are scoped to `itemsvc:nameduseritem:*`.

#### Granted to all three section groups

| Resource | Criteria | Actions |
|---|---|---|
| Scripts | `_itemClass: "Script"` | `READ` |
| Section item | `_userType: 'sections'`, `_id: <sectionId>` | `READ` |
| File collections | `_itemClass: "NamedFileCollection"` | `READ` |

> The `NamedFileCollection` READ permission allows section group members to list file collections, which is required for document listing within subsections.

#### Section Admin

| Resource | Criteria | Actions |
|---|---|---|
| Subsections (create) | `_userType: 'subsections'` | `CREATE` |
| Subsections (read/edit) | `_userType: 'subsections'`, `sectionId: <sectionId>` | `READ`, `EDIT` |
| Links (create) | `_userType: 'links'` | `CREATE` |
| Links (read/edit) | `_userType: 'links'`, `sectionId: <sectionId>` | `READ`, `EDIT` |
| Document logs | `_userType: 'document-logs'` | `READ`, `CREATE` |
| Link logs | `_userType: 'link-logs'` | `READ`, `CREATE` |

#### Section Contributor

| Resource | Criteria | Actions |
|---|---|---|
| Subsections | `_userType: 'subsections'`, `sectionId: <sectionId>` | `READ` |
| Links (create) | `_userType: 'links'` | `CREATE` |
| Links (read/edit) | `_userType: 'links'`, `sectionId: <sectionId>` | `READ`, `EDIT` |
| Document logs | `_userType: 'document-logs'` | `READ`, `CREATE` |
| Link logs | `_userType: 'link-logs'` | `READ`, `CREATE` |

#### Section Viewer

| Resource | Criteria | Actions |
|---|---|---|
| Subsections | `_userType: 'subsections'`, `sectionId: <sectionId>` | `READ` |
| Links | `_userType: 'links'`, `sectionId: <sectionId>` | `READ` |
| Document logs | `_userType: 'document-logs'` | `READ` |
| Link logs | `_userType: 'link-logs'` | `READ` |

---

## Capability Summary

| Capability | Room Admin | Section Admin | Section Contributor | Section Viewer |
|---|:---:|:---:|:---:|:---:|
| View section, subsections, documents, links | ✓ | ✓ | ✓ | ✓ |
| View document and link status logs | ✓ | ✓ | ✓ | ✓ |
| Upload documents | ✓ | ✓ | ✓ | — |
| Create links | ✓ | ✓ | ✓ | — |
| Edit links | ✓ | ✓ | ✓ | — |
| Change document/link status | ✓ | ✓ | — | — |
| Create/edit subsections | ✓ | ✓ | — | — |
| Delete documents (trash) | ✓ | ✓ | ✓ | — |
| Delete links (trash) | ✓ | ✓ | ✓ | — |
| Edit/delete sections | ✓ | — | — | — |
| Access Trash Bin | ✓ | — | — | — |
| Access Manage Users | ✓ | — | — | — |
| Invite users | ✓ | — | — | — |

---

## UI Enforcement of Permissions

The React UI enforces role-based restrictions in addition to the backend permission sets. Roles are resolved at login time via the `GET /users/me` API endpoint and stored in `UserContext`.

The `roles` object shape returned by the API:

```js
// Room Admin
{ room_admin: true }

// Section-scoped user
{
  "<sectionId>": "Section Admin" | "Section Contributor" | "Section Viewer"
}
```

### UI restrictions by role

| Component | Restriction | Role(s) affected |
|---|---|---|
| `VirtualDataRoom` — New Section button | Hidden | Non-room_admin |
| `VirtualDataRoom` — Hamburger menu | Hidden | Non-room_admin |
| `SectionCard` — Section edit (pencil) button | Disabled (dimmed) | Non-room_admin |
| `SectionCard` — Role badge in section header | Shows role name (Room Admin / Section Admin / etc.) | Any user with a role in the section |
| `SectionCard` — New Subsection button | Hidden | Section Viewer, Section Contributor |
| `SubsectionRow` — Subsection edit (pencil) button | Disabled (dimmed) | Section Viewer, Section Contributor |
| `SubsectionRow` — File upload drop zone | Replaced with invisible placeholder | Section Viewer |
| `SubsectionRow` — Link creation form | Replaced with invisible placeholder | Section Viewer |
| `SubsectionRow` — Document status pill | Read-only (no dropdown) | Section Viewer, Section Contributor |
| `SubsectionRow` — Link status pill | Read-only (no dropdown) | Section Viewer, Section Contributor |
| `SubsectionRow` — Document trash button | Disabled (dimmed) | Section Viewer |
| `SubsectionRow` — Link trash button | Disabled (dimmed) | Section Viewer |
| `SubsectionRow` — Link edit button | Disabled (dimmed) | Section Viewer |
| `TrashBin` page | Redirects to `/` on mount | Non-room_admin |
| `ManageUsers` page | Redirects to `/` on mount | Non-room_admin |

> Invisible placeholders maintain the grid column layout so that the document and link tables stay aligned regardless of the user's role.

---

## Section Creation Flow — Permissions Step

`_createSectionUserGroups` is the final step in `createSection`, called after the section item and file service folder have both been created. The full sequence is:

1. Look up the **Room Admin** group (must exist — returns 500 if not found)
2. Look up the current **project workspace** (required for `_userAttributes.project_workspace`)
3. Create **Section Admin**, **Section Contributor**, and **Section Viewer** groups simultaneously, each with `_userAttributes.section` and `_userAttributes.project_workspace`
4. Grant Room Admin `*` on all three new groups (passport service)
5. Grant all three groups `READ` on workspaces (passport service)
6. Grant file service permissions on the section's folder
7. Grant item service permissions (scripts, section item, file collections, subsections, links, logs)

If any step fails, the function returns an error. The section item and folder will already exist at that point, so partial permission failures should be investigated and corrected manually.

---

## Known Limitations

- **No group cleanup on delete**: When a section is permanently deleted, the three section user groups are not deleted. They become orphaned groups with no associated section. A future `deleteSection` update should include group cleanup.
- **No permissions for section-level trash/untrash**: The current permission sets do not include `EDIT` on the section item itself for section-scoped groups. Only the Room Admin (or a global admin) can trash/untrash sections.
- **Role priority per section**: If a user somehow belongs to multiple section groups for the same section, `getMe` applies the highest-privilege role that matches (`Section Admin` > `Section Contributor` > `Section Viewer`).

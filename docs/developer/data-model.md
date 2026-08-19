# Data Model

Content in the VDR is organised in a strict three-level hierarchy: **Sections → Subsections → Documents / Links**.

---

## Hierarchy

```
Room (Twinit Project)
└── Section  (e.g. "01 - Legal")
    └── Subsection  (e.g. "01.01 - Contracts")
        ├── Document  (uploaded file)
        └── Link      (URL reference)
```

A **Section** can have many **Subsections**. Each Section and each Subsection has its own file service folder in Twinit. Subsection folders are created as children of their parent Section's folder, giving the file storage the same hierarchy as the content structure.

### File Service Folder Hierarchy

```
Section folder  (folderId stored on the Section item)
└── Subsection folder  (folderId stored on the Subsection item, parent = Section folder)
    └── Uploaded documents
```

Documents are uploaded directly into the Subsection's folder. The Section folder acts as a container that groups all of its Subsection folders, which simplifies bulk operations such as deleting an entire Section.

---

## Section

Stored as a Twinit item managed by the `sections-api` backend script.

| Field | Type | Description |
|---|---|---|
| `_id` | string | Unique identifier |
| `number` | string | Display ordering number (e.g. `"01"`) |
| `name` | string | Human-readable section name |
| `folderId` | string | ID of the Twinit file service folder for this section (parent of all subsection folders) |
| `trash` | boolean | Whether the section is in the trash |

Sections are sorted client-side by `number` using `localeCompare`.

---

## Subsection

Stored as a child item under a Section.

| Field | Type | Description |
|---|---|---|
| `_id` | string | Unique identifier |
| `number` | string | Display ordering number (e.g. `"01.01"`) |
| `name` | string | Human-readable subsection name |
| `description` | string | Optional description |
| `sectionId` | string | ID of the parent Section |
| `folderId` | string | ID of the Twinit file service folder for this subsection's documents (child of the Section's folder) |
| `trash` | boolean | Whether the subsection is in the trash |

Subsections are sorted client-side by `number` using `localeCompare`.

### Subsection Status Summary

The API exposes a `GET /sections/:id/subsections/:subid/status` endpoint that returns a `statusCounts` object — a breakdown of how many documents/links in the subsection have each status value. The `SubsectionStatusBar` component uses this to render a proportional status bar.

---

## Document

Documents are files uploaded to a Twinit file folder. The `documents-api` backend script adds VDR-specific metadata (status, trash flag, logs) layered on top of the underlying file record.

| Field | Type | Description |
|---|---|---|
| `_id` | string | Unique identifier (Twinit file ID) |
| `_name` | string | Filename |
| `_tipId` | string | ID of the most recent version |
| `status` | string | Current workflow status (e.g. `"For Review"`, `"Approved"`, `"Rejected"`) |
| `trashed` | boolean | Whether the document is in the trash |
| `sectionId` | string | Parent section ID (denormalised for trash queries) |
| `subsectionId` | string | Parent subsection ID (denormalised for trash queries) |

### Document Versions

Each upload creates a new **version** of the document (not a new document). Versions are retrieved via `GET /documents/:fileid/versions` and sorted newest-first by `_version` number. Each version has an associated status log (`/versions/:versionid/logs`).

### Document Status Lifecycle

When a document is uploaded, the `_postProcessDocument` function in `useDocuments.js` automatically:
1. Calls the vectorize endpoint to enable full-text search
2. Sets the document's initial status to `"For Review"`

The available status values are fetched from `GET /documents/statuses` and cached with `staleTime: Infinity` (they are expected to be static configuration).

---

## Link

Links are URL references stored as items under a Subsection.

| Field | Type | Description |
|---|---|---|
| `_id` | string | Unique identifier |
| `name` | string | Display name |
| `description` | string | Optional description |
| `url` | string | The full URL (must be `http://` or `https://`) |
| `status` | string | Workflow status (same values as documents) |
| `trashed` | boolean | Whether the link is in the trash |
| `sectionId` | string | Parent section ID (denormalised for trash queries) |
| `subsectionId` | string | Parent subsection ID (denormalised for trash queries) |

### Link Logs

Every status change on a link is recorded as a log entry, accessible via `GET /sections/:id/subsections/:subid/links/:linkid/logs`. The `LinkLogsDialog` component displays this history.

---

## Trash Model

The VDR uses a **soft-delete** pattern. Moving any item to the trash sets its `trashed` flag to `true` on the backend; the item is excluded from normal list queries.

Items remain in the trash until one of two actions is taken:
- **Restore** — calls the `/untrash` endpoint, clearing the `trashed` flag
- **Permanently delete** — calls the `DELETE` endpoint, removing the item entirely

### Cascade behaviour on permanent delete

| Item deleted | Also deletes |
|---|---|
| Section | All its subsections, and all documents and links in those subsections |
| Subsection | All its documents and links |
| Document | Only that document and its versions |
| Link | Only that link |

The Trash Bin page fetches all trashed items in one call via `GET /search/trash`, which returns separate `sections`, `subsections`, `documents`, and `links` arrays.

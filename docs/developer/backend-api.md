# Backend API

The VDR back end runs entirely as **Twinit OMAPI scripts**. There is no separate server. When the client calls `/omapi/{namespace}/sections`, Twinit's OMAPI gateway looks up the route in `VDR-API.json` and executes the matching script.

---

## Template Package

The `setup/template-package-content/` directory contains everything needed to configure a Twinit project as a VDR Room:

| Path | Purpose |
|---|---|
| `omapiConfig/VDR-API.json` | Route definitions: maps HTTP method + path to a backend script |
| `scripts/sections-api.mjs` | Sections, subsections, and links CRUD + trash/untrash |
| `scripts/documents-api.mjs` | Document status, versions, trash/untrash, vectorize |
| `scripts/search-api.mjs` | Full-text search and trash item search |
| `scripts/users-api.mjs` | Current user role resolution, group listing, and user invitations |
| `custom/custom-setup.mjs` | Bootstrap script run once during template deployment |
| `manifest.json` | Template package manifest |

---

## API Base URL

All VDR API calls use the path prefix:

```
{VITE_TWINIT_API}/omapi/{namespace}/
```

Where `{namespace}` is the first namespace of the active Twinit project (`project._namespaces[0]`).

All requests include an `Authorization: Bearer {accessToken}` header.

---

## Response Envelope

All OMAPI responses wrap their payload in a `_result` object:

```json
{
  "_result": {
    "sections": [ ... ]
  }
}
```

All repsonse examples for the API listed below will specify the contents of the _result.

---

## Sections API

Script: `sections-api.mjs`

| Method | Path | Script function | Description |
|---|---|---|---|
| `GET` | [`/sections`](#get-sections) | `getSections` | List all sections (supports `?trash=true` for trashed items) |
| `POST` | [`/sections`](#post-sections) | `createSection` | Create a new section and its file service folder |
| `PUT` | [`/sections/:id`](#put-sectionsid) | `updateSection` | Update section number/name |
| `POST` | [`/sections/:id/trash`](#post-sectionsidtrash) | `trashSection` | Move section to trash |
| `POST` | [`/sections/:id/untrash`](#post-sectionsiduntrash) | `untrashSection` | Restore section from trash |
| `DELETE` | [`/sections/:id`](#delete-sectionsid) | `deleteSection` | Permanently delete section — must be in trash; cascades to subsections/documents/links |

### `GET /sections`

**Query params:**

| Param | Type | Description |
|---|---|---|
| `trash` | `boolean` | If `true`, returns only trashed sections. Omit for active sections. |

**Response:**

```json
{
  "_result": {
    "sections": [
      {
        "_id": "<sectionId>",
        "number": "01",
        "name": "Legal Documents",
        "folderId": "<fileServiceFolderId>"
      }
    ]
  }
}
```

### `POST /sections`

**Request body:**

```json
{
  "number": "01",
  "name": "Legal Documents"
}
```

| Field | Type | Constraints |
|---|---|---|
| `number` | `string` | Max 5 characters; must be unique among non-trashed sections |
| `name` | `string` | Max 50 characters; must be unique among non-trashed sections |

**Response:** 

```json
{ "_result": { 
    "section": {
      "_id": "<sectionId>",
      "number": "01",
      "name": "Legal Documents",
      "folderId": "<fileServiceFolderId>"
    }
}}`
```

#### Section Creation Detail

When a section is created, the backend:
1. Validates that the number (max 5 chars) and name (max 50 chars) are unique among non-trashed sections
2. Creates the section item in Twinit's item service
3. Creates a file service folder using the section's `_id` as the folder name
4. Updates the section item to store the new folder's `folderId`
5. Calls `_createSectionUserGroups()` to create three section-scoped user groups (Section Admin, Section Contributor, Section Viewer) and configure all associated passport, file service, and item service permissions

See [Permissions & Access Control](./permissions.md) for the full details of what `_createSectionUserGroups` sets up.

### `PUT /sections/:id`

**Request body:** Full section object including `_id`:

```json
{
  "_id": "<sectionId>",
  "number": "01",
  "name": "Legal Documents",
  "folderId": "<fileServiceFolderId>"
}
```

**Response:** 

```json
{ "_result": { 
    "section": {
      "_id": "<sectionId>",
      "number": "01",
      "name": "Legal Documents",
      "folderId": "<fileServiceFolderId>"
    }
}}`
```

### `POST /sections/:id/trash`

No request body.

**Response:** 

```json
{ "_result": { 
    "section": {
      "_id": "<sectionId>",
      "number": "01",
      "name": "Legal Documents",
      "folderId": "<fileServiceFolderId>",
      "trash": true
    }
}}`
```

### `POST /sections/:id/untrash`

No request body.

**Response:** 

```json
{ "_result": { 
    "section": {
      "_id": "<sectionId>",
      "number": "01",
      "name": "Legal Documents",
      "folderId": "<fileServiceFolderId>",
      "trash": false
    }
}}`
```

### `DELETE /sections/:id`

No request body.

**Response:** 

```json
{ "_result": { }}
```

#### Section Deletion Detail

`deleteSection` will return a 404 if the section is **not** in the trash — permanent deletion is only allowed from the Trash Bin. When called on a trashed section, the backend:
1. Fetches all subsections belonging to the section
2. Calls `IafFileSvc.deleteFiles()` with all subsection `folderId` values — this deletes the subsection folders and all files (documents) inside them in a single call
3. Deletes all link items belonging to the section
4. Deletes all subsection items
5. Deletes the section folder and item itself


---

### Subsections

Script: `sections-api.mjs`

| Method | Path | Script function | Description |
|---|---|---|---|
| `GET` | [`/sections/:id/subsections`](#get-sectionsidsubsections) | `getSubsections` | List subsections for a section |
| `POST` | [`/sections/:id/subsections`](#post-sectionsidsubsections) | `createSubsection` | Create a subsection and its file service folder (nested inside the section's folder) |
| `PUT` | [`/sections/:id/subsections/:subid`](#put-sectionsidsubsectionssubid) | `updateSubsection` | Update subsection number/name/description |
| `POST` | [`/sections/:id/subsections/:subid/trash`](#post-sectionsidsubsectionssubidtrash--post-untrash) | `trashSubsection` | Move to trash |
| `POST` | [`/sections/:id/subsections/:subid/untrash`](#post-sectionsidsubsectionssubidtrash--post-untrash) | `untrashSubsection` | Restore from trash |
| `DELETE` | [`/sections/:id/subsections/:subid`](#delete-sectionsidsubsectionssubid) | `deleteSubsection` | Permanently delete (cascades) |
| `GET` | [`/sections/:id/subsections/:subid/status`](#get-sectionsidsubsectionssubidstatus) | `getSubsectionStatus` | Returns `statusCounts` breakdown |
| `GET` | [`/sections/:id/subsections/:subid/documents`](#get-sectionsidsubsectionssubiddocuments) | `getDocuments` | List documents in a subsection |

### `GET /sections/:id/subsections`

No query params.

**Response:**

```json
{
  "_result": {
    "subsections": [
      {
        "_id": "<subsectionId>",
        "number": "01.1",
        "name": "Contracts",
        "description": "Executed agreements",
        "folderId": "<fileServiceFolderId>"
      }
    ]
  }
}
```

### `POST /sections/:id/subsections`

**Request body:**

```json
{
  "number": "01.1",
  "name": "Contracts",
  "description": "Executed agreements"
}
```

| Field | Type | Constraints |
|---|---|---|
| `number` | `string` | Must be unique among non-trashed subsections in this section |
| `name` | `string` | Must be unique among non-trashed subsections in this section |
| `description` | `string` | Optional |

**Response:**

```json
{
  "_result": {
    "subsection": {
      "_id": "<subsectionId>",
      "number": "01.1",
      "name": "Contracts",
      "description": "Executed agreements",
      "folderId": "<fileServiceFolderId>"
    }
  }
}
```

### Subsection Creation Detail

When a subsection is created, the backend:
1. Validates that the number and name are unique among non-trashed subsections
2. Creates the subsection item with a temporary `folderId: 'creating'` placeholder
3. Creates a file service folder using the subsection's `_id` as the folder name, with the **parent section's `_id`** as the parent — this places the subsection folder inside the section's folder
4. Updates the subsection item to store the new folder's `folderId`

### `PUT /sections/:id/subsections/:subid`

**Request body:**

```json
{
  "_id": "<subsectionId>",
  "number": "01.1",
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response:** 

```json
{
  "_result": {
    "subsection": {
      "_id": "<subsectionId>",
      "number": "01.1",
      "name": "Contracts",
      "description": "Executed agreements",
      "folderId": "<fileServiceFolderId>"
    }
  }
}
```

### `POST /sections/:id/subsections/:subid/trash`

No request body.

**Response:** 

```json
{
  "_result": {
    "subsection": {
      "_id": "<subsectionId>",
      "number": "01.1",
      "name": "Contracts",
      "description": "Executed agreements",
      "folderId": "<fileServiceFolderId>",
      "trash": true
    }
  }
}
```

### `POST /sections/:id/subsections/:subid/untrash`

No request body.

**Response:** 

```json
{
  "_result": {
    "subsection": {
      "_id": "<subsectionId>",
      "number": "01.1",
      "name": "Contracts",
      "description": "Executed agreements",
      "folderId": "<fileServiceFolderId>",
      "trash": true
    }
  }
}
```

### `DELETE /sections/:id/subsections/:subid`

No request body.

**Response:** 

```json
{ "_result": { }}
```

### `GET /sections/:id/subsections/:subid/status`

No query params.

**Response:**

```json
{
  "_result": {
    "statusCounts": {
      "For Review": 3,
      "Approved": 1,
      "Rejected": 0
    }
  }
}
```

### `GET /sections/:id/subsections/:subid/documents`

No query params.

**Response:**

```json
{
  "_result": {
    "documents": [
      {
        "_id": "<fileId>",
        "_name": "Executive Summary.pdf",
        "_tipId": "<versionId>",
        "_type": "file",
        "_tags": [
          "status:Rejected"
        ],
        "_irn": "filesvc:file:<fileId>",
        "_status": "UPLOAD_COMPLETED",
        "_parents": [
          "<fileServiceFolderId>"
        ],
        "_nextVersion": 2,
        "_namespaces": [
          "<namespace>"
        ],
        "_tipVersion": 1,
        "_uploadMeta": {
          "_size": 31,
          "_uploadOffset": 31,
          "_checksum": "<checksum>",
          "_uploadId": "<uploadId>"
        },
        "_metadata": {
          "_updatedById": "<userId>",
          "_createdAt": 1776283853349,
          "_createdById": "<userId>",
          "_updatedAt": 1776283854906
        },
        "_url": "<download url>"
      }
    ]
  }
}
```

### Links

Script: `sections-api.mjs`

| Method | Path | Script function | Description |
|---|---|---|---|
| `GET` | [`/sections/:id/subsections/:subid/links`](#get-sectionsidsubsectionssubidlinks) | `getLinks` | List links in a subsection |
| `POST` | [`/sections/:id/subsections/:subid/links`](#post-sectionsidsubsectionssubidlinks) | `createLink` | Add a new link |
| `PUT` | [`/sections/:id/subsections/:subid/links/:linkid`](#put-sectionsidsubsectionssubidlinkslinkid) | `updateLink` | Edit link name/description/URL |
| `PUT` | [`/sections/:id/subsections/:subid/links/:linkid/status`](#put-sectionsidsubsectionssubidlinkslinkidstatus) | `updateLinkStatus` | Change link status (records a log entry) |
| `POST` | [`/sections/:id/subsections/:subid/links/:linkid/trash`](#post-sectionsidsubsectionssubidlinkslinkidtrash) | `trashLink` | Move link to trash |
| `POST` | [`/sections/:id/subsections/:subid/links/:linkid/untrash`](#post-sectionsidsubsectionssubidlinkslinkiduntrash) | `untrashLink` | Restore link from trash |
| `DELETE` | [`/sections/:id/subsections/:subid/links/:linkid`](#delete-sectionsidsubsectionssubidlinkslinkid) | `deleteLink` | Permanently delete link |
| `GET` | [`/sections/:id/subsections/:subid/links/:linkid/logs`](#get-sectionsidsubsectionssubidlinkslinkidlogs) | `getLinkLogs` | Retrieve link status change history |

### `GET /sections/:id/subsections/:subid/links`

No query params.

**Response:**

```json
{
  "_result": {
    "links": [
      {
        "_id": "<linkId>",
        "name": "Company Website",
        "description": "Public homepage",
        "url": "https://example.com",
        "status": "For Review",
        "trash": false
      }
    ]
  }
}
```

### `POST /sections/:id/subsections/:subid/links`

**Request body:**

```json
{
  "name": "Company Website",
  "description": "Public homepage",
  "url": "https://example.com"
}
```

**Response:**

```json
{
  "_result": {
    "link": {
      "_id": "<linkId>",
      "name": "Company Website",
      "description": "Public homepage",
      "url": "https://example.com",
      "status": "For Review",
      "trash": false
    }
  }
}
```

### `PUT /sections/:id/subsections/:subid/links/:linkid`

**Request body:**

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "url": "https://updated-url.com"
}
```

**Response:**

```json
{
  "_result": {
    "link": {
      "_id": "<linkId>",
      "name": "Updated Name",
      "description": "Updated description",
      "url": "https://updated-url.com",
      "status": "For Review"
    }
  }
}
```

### `PUT /sections/:id/subsections/:subid/links/:linkid/status`

**Request body:**

```json
{
  "status": "Approved"
}
```

**Response:**

```json
{
  "_result": {
    "link": {
      "_id": "<linkId>",
      "name": "Updated Name",
      "description": "Updated description",
      "url": "https://updated-url.com",
      "status": "Approved"
    }
  }
}
```

### `POST /sections/:id/subsections/:subid/links/:linkid/trash`

No request body.

**Response:**

```json
{
  "_result": {
    "link": {
      "_id": "<linkId>",
      "name": "Company Website",
      "description": "Public homepage",
      "url": "https://example.com",
      "status": "For Review",
      "trash": true
    }
  }
}
```

### `POST /sections/:id/subsections/:subid//links/:linkid/untrash`

No request body.

**Response:**

```json
{
  "_result": {
    "link": {
      "_id": "<linkId>",
      "name": "Company Website",
      "description": "Public homepage",
      "url": "https://example.com",
      "status": "For Review",
      "trash": false
    }
  }
}
```

### `DELETE /sections/:id/subsections/:subid/links/:linkid`

No request body.

**Response:** 

```json
{ "_result": { }}
```

### `GET /sections/:id/subsections/:subid/links/:linkid/logs`

No query params.

**Response:**

```json
{
  "_result": {
    "linkLogs": [
      {
        "note": "",
        "linkId": "<linkId>",
        "_id": "<logId>",
        "sectionId": "<sectionId>",
        "subsectionId": "<subsectionId>",
        "message": "Link Created",
        "_metadata": {
          "_updatedById": "<userId>",
          "_createdAt": 1776283925514,
          "_createdById": "<userId>",
          "_updatedAt": 1776283925514
        },
        "userId": "<userId>",
        "status": "For Review",
        "username": "<username>"
      }
    ]
  }
}
```

---

## Documents API

Script: `documents-api.mjs`

> Documents are uploaded directly to Twinit's file service by the client using `IafFileSvc.addFileResumable()`. The Documents API then adds VDR metadata (status, trash flag, logs) on top of the underlying file.
### Document Upload Flow

File upload bypasses the OMAPI layer and uses the platform SDK directly:

1. `IafFileSvc.addFileResumable()` is called with the file, the project namespace, and the subsection's `folderId`
2. Progress callbacks update the UI upload indicator
3. On completion, `_postProcessDocument()` is called:
   - Calls `POST /documents/:fileid/versions/:versionid/vectorize` to trigger text indexing
   - Calls `PUT /documents/:fileid/status` to set the initial status to `"For Review"`
4. Up to 3 files upload concurrently (controlled by `_withConcurrency`)

---

| Method | Path | Script function | Description |
|---|---|---|---|
| `GET` | [`/documents/statuses`](#get-documentsstatuses) | `getDocumentStatuses` | List valid status values (static configuration) |
| `PUT` | [`/documents/:fileid/status`](#put-documentsfileidstatus) | `setDocumentStatus` | Update status; records a log entry |
| `POST` | [`/documents/:fileid/trash`](#post-documentsfileidtrash) | `trashDocument` | Move document to trash |
| `POST` | [`/documents/:fileid/untrash`](#post-documentsfileiduntrash) | `untrashDocument` | Restore document from trash |
| `DELETE` | [`/documents/:fileid`](#delete-documentsfileid) | `deleteDocument` | Permanently delete document |
| `GET` | [`/documents/:fileid/versions`](#get-documentsfileidversions) | `getDocumentVersions` | List all versions of a document, newest first |
| `GET` | [`/documents/:fileid/versions/:versionid/logs`](#get-documentsfileidversionsversionidlogs) | `getDocumentLogs` | Retrieve status change history for a specific version |
| `POST` | [`/documents/:fileid/versions/:versionid/vectorize`](#post-documentsfileidversionsversionidvectorize) | `vectorizeDocumentVersion` | Trigger full-text indexing of a document version |

### `GET /documents/statuses`

No query params.

**Response:**

```json
{
  "_result": {
    "statuses": ["For Review", "Approved", "Rejected"]
  }
}
```

### `PUT /documents/:fileid/status`

**Request body:**

```json
{
  "status": "Approved",
  "message": "Status changed to Approved",
  "note": "Reviewed and signed off by legal"
}
```

| Field | Type | Description |
|---|---|---|
| `status` | `string` | New status value (must be one of the configured statuses) |
| `message` | `string` | Log message describing the change |
| `note` | `string` | Optional reviewer note; only included if non-empty |

On upload, the initial status call uses `{ status: 'For Review', message: 'Document uploaded' }` with no `note`.

**Response:**

```json
{
  "_result": {
    "document": {
      "_id": "<fileId>",
      "_name": "Executive Summary.pdf",
      "_tipId": "<versionId>",
      "_type": "file",
      "_tags": [
        "status:Approved"
      ],
      "_irn": "filesvc:file:<fileId>",
      "_status": "UPLOAD_COMPLETED",
      "_parents": [
        "<fileServiceFolderId>"
      ],
      "_nextVersion": 2,
      "_namespaces": [
        "<namespace>"
      ],
      "_tipVersion": 1,
      "_uploadMeta": {
        "_size": 31,
        "_uploadOffset": 31,
        "_checksum": "<checksum>",
        "_uploadId": "<uploadId>"
      },
      "_metadata": {
        "_updatedById": "<userId>",
        "_createdAt": 1776283853349,
        "_createdById": "<userId>",
        "_updatedAt": 1776283854906
      },
      "_url": "<download url>"
    }
  }
}
```

### `POST /documents/:fileid/trash`

No request body.

**Response:**

```json
{
  "_result": {
    "document": {
      "_id": "<fileId>",
      "_name": "Executive Summary.pdf",
      "_tipId": "<versionId>",
      "_type": "file",
      "_tags": [
        "status:Approved, trash"
      ],
      "_irn": "filesvc:file:<fileId>",
      "_status": "UPLOAD_COMPLETED",
      "_parents": [
        "<fileServiceFolderId>"
      ],
      "_nextVersion": 2,
      "_namespaces": [
        "<namespace>"
      ],
      "_tipVersion": 1,
      "_uploadMeta": {
        "_size": 31,
        "_uploadOffset": 31,
        "_checksum": "<checksum>",
        "_uploadId": "<uploadId>"
      },
      "_metadata": {
        "_updatedById": "<userId>",
        "_createdAt": 1776283853349,
        "_createdById": "<userId>",
        "_updatedAt": 1776283854906
      },
      "_url": "<download url>"
    }
  }
}
```

### `POST /documents/:fileid/untrash`

No request body.

**Response:**

```json
{
  "_result": {
    "document": {
      "_id": "<fileId>",
      "_name": "Executive Summary.pdf",
      "_tipId": "<versionId>",
      "_type": "file",
      "_tags": [
        "status:Approved"
      ],
      "_irn": "filesvc:file:<fileId>",
      "_status": "UPLOAD_COMPLETED",
      "_parents": [
        "<fileServiceFolderId>"
      ],
      "_nextVersion": 2,
      "_namespaces": [
        "<namespace>"
      ],
      "_tipVersion": 1,
      "_uploadMeta": {
        "_size": 31,
        "_uploadOffset": 31,
        "_checksum": "<checksum>",
        "_uploadId": "<uploadId>"
      },
      "_metadata": {
        "_updatedById": "<userId>",
        "_createdAt": 1776283853349,
        "_createdById": "<userId>",
        "_updatedAt": 1776283854906
      },
      "_url": "<download url>"
    }
  }
}
```

### `DELETE /documents/:fileid`

No request body.

**Response:** 

```json
{ "_result": { }}
```

### `GET /documents/:fileid/versions`

No query params.

**Response:**

```json
{
  "_result": {
    "versions": [
        {
          "_fileSize": 31,
          "_objMetadata": {},
          "_id": "<versionId>",
          "_metadata": {
            "_updatedById": "<userId>",
            "_createdAt": 1776283853349,
            "_createdById": "<userId>",
            "_updatedAt": 1776283853349
          },
          "_version": 1,
          "_fileId": "<fileId>",
    "logs": [ "<version logs>" ],
    "_url": "<download url>"
  }
    ]
  }
}
```

### `GET /documents/:fileid/versions/:versionid/logs`

No query params.

**Response:**

```json
{
  "_result": {
    "logs": [
      {
        "_id": "<logId>",
        "status": "Approved",
        "message": "Status changed to Approved",
        "note": "Reviewed by legal",
        "timestamp": "2024-01-15T10:30:00Z",
        "user": "user@example.com"
      }
    ]
  }
}
```

### `POST /documents/:fileid/versions/:versionid/vectorize`

**Request body:**

```json
{
  "type": "pdf",
  "name": "contract",
  "userType": "contract_<namespace>"
}
```

| Field | Type | Description |
|---|---|---|
| `type` | `string` | File extension (e.g. `"pdf"`, `"docx"`) |
| `name` | `string` | Filename without extension |
| `userType` | `string` | `{name}_{namespace}` — namespaced identifier for the search index |

**Response:** 

```json
{ "_result": { }}
```

---

## Search API

Script: `search-api.mjs`

| Method | Path | Script function | Description |
|---|---|---|---|
| `POST` | [`/search`](#post-search) | `search` | Search across documents and links |
| `GET` | `/search/trash` | `searchTrash` | Returns all trashed items |

### `POST /search`

**Request body:**

```json
{
  "query": "acquisition agreement"
}
```

**Response:**

```json
{
  "_result": {
    "searchResults": {
      "documents": [
        {
          "_id": "<fileId>",
          "_name": "acquisition-agreement.pdf",
          "sectionId": "<sectionId>",
          "subsectionId": "<subsectionId>"
        }
      ],
      "links": [
        {
          "_id": "<linkId>",
          "name": "Acquisition Filing",
          "url": "https://example.com/filing"
        }
      ]
    }
  }
}
```

## Users API

Script: `users-api.mjs`

The Users API handles role resolution, group listing, user management, and user invitations. All endpoints require the caller to be an authenticated Twinit user.

| Method | Path | Script function | Description |
|---|---|---|---|
| `GET` | [`/users/me`](#get-usersme) | `getMe` | Returns the current user's profile and computed role assignments for this project |
| `GET` | [`/users`](#get-users) | `getAllUsers` | Returns a deduplicated, sorted list of all users across all project groups |
| `GET` | [`/users/groups`](#get-usersgroups) | `getUserGroups` | Lists all user groups scoped to this project, including pending invites per group |
| `GET` | [`/users/groups/:groupid/users`](#get-usersgroupsgroupidusers) | `getGroupUsers` | Lists all users in a specific group |
| `POST` | [`/users/invite`](#post-usersinvite) | `inviteUsers` | Invites a user by email to one or more groups |
| `DELETE` | [`/users/groups/:groupid/users/:userid`](#delete-usersgroupsgroupidusersuserid) | `removeUserFromGroup` | Removes a user from a specific group |
| `DELETE` | [`/users/:userid/groups`](#delete-usersuseridgroups--remove-user-from-all-groups) | `removeUserFromAllGroups` | Removes a user from every group in the project |
| `DELETE` | [`/users/groups/:groupid/invites/:inviteid`](#delete-usersgroupsgroupidinvitesinviteid) | `cancelInvite` | Cancels a pending group invitation |

### `GET /users/me`

No query params.

**Response:**

```json
{
  "_result": {
    "data": {
      "user": {
        "_id": "<userId>",
        "_firstname": "Jane",
        "_lastname": "Smith",
        "_email": "jane@example.com"
      },
      "roles": {
        "room_admin": true,
        "<section id>": "<role name>"
      }
    }
  }
}
```

The `roles` object is computed from the groups the current user belongs to, filtered to those whose `_userAttributes.project_workspace._id` matches the current project. This filtering is why all section groups must store `project_workspace` in their `_userAttributes` (see [Permissions](./permissions.md)).

Role resolution logic:
- If the user belongs to a group named `'Room Admin'` for this project → `{ room_admin: true }`
- Otherwise, for each section the user has a group in, the highest-privilege role wins:
  - `'Section Admin'` > `'Section Contributor'` > `'Section Viewer'`

### `GET /users`

No query params.

**Response:**

```json
{
  "_result": {
    "users": [
      {
        "_id": "<userId>",
        "_firstname": "Jane",
        "_lastname": "Smith",
        "_email": "jane@example.com"
      }
    ]
  }
}
```

Returns a deduplicated list of every user across all project groups (excluding the calling user), sorted alphabetically by last name then first name. Users that appear in multiple groups are deduplicated by `_id`.

### `GET /users/groups`

No query params.

**Response:**

```json
{
  "_result": {
    "groups": [
      {
        "_id": "<groupId>",
        "_name": "Room Admin",
        "_userAttributes": {
          "project_workspace": { "_id": "<projectId>" }
        },
        "invites": [
          {
            "_id": "<inviteId>",
            "_email": "pending@example.com",
            "_status": "PENDING",
            "_expireTime": "2024-02-15T00:00:00Z"
          }
        ]
      }
    ]
  }
}
```

Returns all groups whose `_userAttributes.project_workspace._id` matches the current project. After fetching groups, the script calls `IafPassSvc.getUserGroupInvites()` for each group to attach an `invites` array containing all `PENDING`, `EXPIRED`, and `REJECTED` invitations.

### `GET /users/groups/:groupid/users`

No query params.

**Response:**

```json
{
  "_result": {
    "users": [
      {
        "_id": "<userId>",
        "_firstname": "Jane",
        "_lastname": "Smith",
        "_email": "jane@example.com"
      }
    ]
  }
}
```

Paginates through all users in the given group (10 per page).

### `POST /users/invite`

**Request body:**

```json
{
  "email": "user@example.com",
  "base_url": "https://your-vdr-domain.com",
  "groups": [
    {
      "groupId": "<groupId>",
      "groupName": "Section Contributor",
      "section": { "number": "01", "name": "Legal Documents" }
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `email` | `string` | Email address of the user to invite |
| `base_url` | `string` | App origin included in the invitation link (`window.location.origin`) |
| `groups` | `array` | One entry per group to invite into |
| `groups[].groupId` | `string` | Target group ID |
| `groups[].groupName` | `string` | Display name for the role (e.g. `"Section Contributor"`) |
| `groups[].section` | `object` | `{ number, name }` — used in the invitation email body |

For each entry in `groups`, sends one invitation email via `IafPassSvc.inviteUsersToGroup()`. The email includes the project name, section number and name, and the role the invitee is being assigned.

When inviting a Room Admin, `groups` contains a single entry with `section: { number: 'All', name: 'Sections' }`.

**Response:** 

```json
{
  "_result": {
    "invites": [ "<invite array>" ]
  }
}
```

### `DELETE /users/groups/:groupid/users/:userid`

No request body.

**Response:**

```json
{
  "_result": {}
}
```

Users cannot remove themselves from groups.

### `DELETE /users/:userid/groups` — Remove User from All Groups

No request body.

Internally calls `getUserGroups()` to retrieve the full list of project groups and iterates through them calling `IafPassSvc.deleteUsersFromGroup()` for each. Errors on individual groups are swallowed and logged so that the removal continues across all groups.

**Response:**

```json
{
  "_result": {}
}
```

### `DELETE /users/groups/:groupid/invites/:inviteid`

No request body.

Sets the invitation's `_status` to `'CANCELLED'` via `IafPassSvc.updateUserGroupInvite()`.

**Response:**

```json
{
  "_result": {}
}
```

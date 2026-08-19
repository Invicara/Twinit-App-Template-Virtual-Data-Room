# Documents

Documents are files (PDFs, Word documents, images, etc.) uploaded to a subsection. The VDR tracks versions, status, and an audit log for every document.

---

## Uploading Documents

> **Role required:** Section Contributor, Section Admin, or Room Admin. Section Viewers do not see the upload area.

First, expand the subsection you want to upload to (click the chevron on the left of the subsection row).

You will see an **upload area** on the left side of the expanded subsection. There are two ways to upload:

**Drag and drop**
- Drag one or more files from your file manager and drop them onto the upload area

**Click to browse**
- Click anywhere on the upload area to open your computer's file picker
- Select one or more files

Multiple files can be uploaded at once. The upload indicator shows progress as each file completes (e.g. "Uploaded 2 of 5 documents…").

### What happens on upload

When a file is uploaded:
1. The file is stored securely in Twinit's file service
2. The document is indexed for full-text search
3. Its status is automatically set to **For Review**

---

## Viewing a Document

In the document list, click the **view (eye) icon** on any document row. This opens the document in a built-in viewer panel that slides in from the right.

Click anywhere outside the viewer panel, or click the **× close button**, to dismiss it.

---

## Document Versions

Every time you upload a file with the same name to a subsection, it creates a new **version** of that document rather than a separate document. The document list always shows the latest version number.

To see the full version history:
1. Click the **version history (clock) icon** on the document row
2. The Version Log dialog shows all versions with their version numbers, statuses, and status change history

---

## Document Status

Each document has a **status** that represents its review state. The available statuses are:

| Status | Meaning |
|---|---|
| For Review | The document has been uploaded and is awaiting review |
| Approved | The document has been reviewed and approved |
| Rejected | The document has been reviewed and rejected |

### Changing a document's status

> **Role required:** Section Admin or Room Admin. Section Contributors and Viewers see a read-only status badge with no dropdown.

1. In the document row, click the current status pill (the coloured badge)
2. Select the new status from the dropdown that appears
3. A **Status Note** dialog will appear — optionally enter a note explaining the change
4. Confirm the change

Status changes are logged and visible in the Version Log.

---

## Moving a Document to Trash

> **Role required:** Section Contributor, Section Admin, or Room Admin. Section Viewers see a dimmed, non-clickable trash icon.

1. Click the **trash icon** on the document row
2. Confirm in the dialog that appears

The document moves to the Trash Bin. It can be restored or permanently deleted from there. See [Trash Bin](./trash-bin.md).

---

## Downloading a Document

In the Trash Bin's document view, a **download** icon is available on each document row. In the main Room view, you can download directly from the inline document viewer.

# Access & Roles

Access to each section of the Virtual Data Room is controlled by **user groups**. When a section is created, three user groups are automatically set up for it. Each user in the Room is assigned to one of these groups for each section they need to access.

---

## The Room Admin Role

There is one **Room Admin** group for the entire Room (not per section). Room Admins can:

- Create, edit, and delete sections
- Access the Trash Bin and restore or permanently delete trashed items
- Manage users — view group membership and invite new users to any section group
- Access the hamburger menu from the main Room view

> Room Admin membership is managed by a Twinit administrator outside of the VDR application. Contact your Twinit platform administrator to request Room Admin access.

---

## The Three Section Roles

### Section Admin

Full control over the section's content and structure.

- View, upload, and delete documents
- Create, edit, and delete links
- Create, edit, and delete subsections
- Change document and link status
- View all status and change history logs

### Section Contributor

Can add and edit content but cannot restructure the section or delete items.

- View documents, subsections, and links
- Upload new documents
- Create and edit links
- Delete documents and links (move to trash)
- View status and change history logs
- **Cannot** change document or link status
- **Cannot** create, edit, or delete subsections

### Section Viewer

Read-only access to all content in the section.

- View documents, subsections, and links
- View status and change history logs
- **Cannot** upload, create, edit, or delete anything

---

## Role Summary Table

| Action | Room Admin | Section Admin | Section Contributor | Section Viewer |
|---|:---:|:---:|:---:|:---:|
| Create/edit sections | ✓ | — | — | — |
| View sections | ✓ | ✓ | ✓ | ✓ |
| Create/edit subsections | ✓ | ✓ | — | — |
| Delete subsections | ✓ | ✓ | — | — |
| Upload documents | ✓ | ✓ | ✓ | — |
| View documents | ✓ | ✓ | ✓ | ✓ |
| Move documents to trash | ✓ | ✓ | ✓ | — |
| Create/edit links | ✓ | ✓ | ✓ | — |
| Move links to trash | ✓ | ✓ | ✓ | — |
| Change document/link status | ✓ | ✓ | — | — |
| View status history logs | ✓ | ✓ | ✓ | ✓ |
| Access Trash Bin | ✓ | — | — | — |
| Manage users / invite users | ✓ | — | — | — |

---

## How Roles Affect the UI

The application shows or disables controls based on your role. These visual changes are applied automatically — you do not need to configure anything.

### Room Admin only

- The **New Section** button and **hamburger menu (☰)** in the toolbar are visible only to Room Admins
- The **section edit (pencil) icon** on section cards is active only for Room Admins (other users see a dimmed, non-clickable version)
- The **Trash Bin** and **Manage Users** pages redirect non-admins back to the main Room view
- Section cards display **"Room Admin"** as the role badge in the section header

### Section Admin only (within their section)

- The **New Subsection** button at the bottom of a section card is visible only to Section Admins (and Room Admins)
- The **subsection edit (pencil) icon** is active only for Section Admins (dimmed for Contributors and Viewers)
- Section cards display **"Section Admin"** as the role badge in the section header for Section Admins

### Section Viewer restrictions

- The **file upload drop zone** is hidden (replaced by an invisible placeholder that maintains layout)
- The **link creation form** is hidden (same invisible placeholder approach)
- The **document and link trash icons** appear dimmed and cannot be clicked
- The **link edit icon** appears dimmed and cannot be clicked
- Section cards display **"Section Viewer"** as the role badge in the section header

### Section Viewer and Contributor restrictions

- The **document and link status pills** are shown as read-only badges with no dropdown — status cannot be changed
- The **subsection edit (pencil) icon** is dimmed and cannot be clicked
- Section cards display the user's role (**"Section Contributor"** or **"Section Viewer"**) as a badge in the section header

---

## Getting Access to a Section

If you cannot see a section, or cannot perform an action you expect to be able to do, contact your **Room Admin**. They can add you to the appropriate section group (Section Admin, Contributor, or Viewer) for the sections you need access to via the **Manage Users** page.

Each section has its own independent set of groups, so you may have different roles in different sections — for example, Section Admin in one section and Section Viewer in another.

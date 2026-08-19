# Managing Sections

Sections are the top level of the Virtual Data Room's content hierarchy. Think of them as the major categories or folders that contain your subsections and ultimately your documents and links.

Each section has a **number** (used for ordering) and a **name**.

> **Role required:** Creating, editing, and deleting sections requires the **Room Admin** role. The New Section button and section edit icon are not available to other roles. See [Access & Roles](./access-and-roles.md).

---

## Creating a Section

1. From the main Room view, click the **New Section** button in the toolbar
2. In the dialog that appears, enter:
   - **Number** — a string used to sort sections (e.g. `01`, `02`, `A`, `A1`). Sections are sorted alphabetically by number.
   - **Name** — the section's display name (e.g. "Legal Documents")
3. Click **Create** (or the confirm button) to save

The new section will appear in the list, ordered by its number.

> **Note:** Creating a section also automatically creates three user groups for it (Section Admin, Section Contributor, Section Viewer) and configures all associated permissions. See your Room Admin about assigning users to these groups.

---

## Editing a Section

1. Find the section you want to edit in the Room view
2. Click the **pencil (edit) icon** in the section header
3. Update the number and/or name in the dialog
4. Save your changes

> **Note:** The edit icon is visible to all users but is only active (clickable) for Room Admins. Other users see a dimmed version of the icon.

> **Note:** Changing a section's number will reorder it in the list.

---

## Viewing Section Admins

Each section card displays your role as a small badge below the section name. For Room Admins, next to that badge, a **people icon** is shown whenever the section has an admin group configured.

- Hover over the icon to see the **"View Section Admins"** tooltip
- Click the icon to open a popup listing the full names of all users currently assigned the **Section Admin** role for that section
- Click anywhere outside the popup to dismiss it

This is visible to any user who has a role in the section, making it easy to know who to contact about access or content decisions without leaving the Room.

---

## Expanding and Collapsing Subsections

Each section card shows its subsections in a table. By default, subsections are collapsed (their documents and links are hidden).

- Click the **expand/collapse arrow** next to a subsection to toggle it individually
- Use the **Expand All** / **Collapse All** button in the section header to toggle all subsections at once

---

## Moving a Section to Trash

To remove a section you no longer need:

1. Click the **pencil (edit) icon** on the section
2. In the edit dialog, use the **trash / delete** option

The section moves to the Trash Bin along with all of its subsections, documents, and links. Nothing is permanently deleted until you choose to do so from the [Trash Bin](./trash-bin.md).

> **Warning:** Permanently deleting a section from the Trash Bin also permanently deletes all subsections, documents, and links that belong to it.

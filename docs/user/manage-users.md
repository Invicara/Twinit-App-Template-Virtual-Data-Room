# Manage Users

The Manage Users page lets Room Admins view who has access to each section, manage group membership, and invite new users.

> **Role required:** Room Admin only. Other users are automatically redirected to the main Room view if they attempt to access this page.

---

## Opening Manage Users

From the main Room view, click the **hamburger menu (☰)** in the toolbar and select **Manage Users**.

Click **← Back to Room** at the top of the page to return to the main view.

---

## Understanding the Page Layout

The page is organised into blocks:

1. **Room Admin** — the Room-level admin group, shown at the top
2. One block per section — each section block contains three group rows:
   - Section Admin
   - Section Contributor
   - Section Viewer

Each group row shows the group name. Click the row (or its expand arrow) to see the list of users currently in that group.

---

## Viewing Users in a Group

Click on any group row to expand it. The row loads and displays all users currently in that group, showing their first name, last name, and email address.

Each user row has two action buttons:

- **Remove from this group** (trash icon) — removes the user from the selected group only. Their access to other groups in the Room is unaffected.
- **Remove from all groups** (circle-X icon) — removes the user from every group in the entire Room, revoking all access in one step.

> **Note:** You cannot remove yourself from a group. The action buttons are disabled for your own user account.

If the group has no members, it shows an empty state message.

---

## Viewing and Cancelling Pending Invitations

When a group is expanded, any outstanding invitations appear below the user list in a **Pending Invites** table. Each row shows:

- **Email** — the invited address
- **Status** — `Pending`, `Expired`, or `Rejected`
- **Expires** — the date and time the invitation link expires

To cancel a pending invitation, click the **trash icon** in that row. This cancels the invite immediately; the invitation link in the email will no longer be valid.

> Only invitations with a status of **Pending** can be cancelled. Expired and rejected invitations are shown for reference only.

---

## Inviting a User

1. Click the **+ Invite User** button at the top of the page
2. In the **Invite User** dialog:
   - **Select an existing user** — if the project already has users, a dropdown lists them by name. Selecting one pre-fills the email field automatically.
   - **Or enter a new email** — type any email address directly into the email field.
3. Choose the access level:
   - **Room Admin** — tick the _Room Admin_ checkbox to invite the user as a Room Admin. This grants access to all sections and admin capabilities. Section role selects are disabled when this is checked.
   - **Section roles** — for each section, use the dropdown to assign the user as Section Admin, Section Contributor, or Section Viewer. Leave a section at _No Access_ to not add the user to that section.
4. Click **Invite**

The user will receive one invitation email per group assignment. Each email includes the project name, section name, and the role they are being assigned. The user must accept the invitation to gain access.

> **Note:** Invitations are sent by the Twinit platform. If a user does not receive their invitation, check that the email address is correct and ask them to check their spam folder.

---

## Role Summary

| Role | What the user can do |
|---|---|
| **Room Admin** | Full access to all sections; create/edit/delete sections; access Trash Bin; manage all users |
| **Section Admin** | Full content access within their section(s); create/edit subsections; change status |
| **Section Contributor** | Upload documents and create/edit links within their section(s); cannot change status or manage structure |
| **Section Viewer** | Read-only access to their section(s); cannot upload, create, edit, or delete anything |

For a full breakdown see [Access & Roles](./access-and-roles.md).

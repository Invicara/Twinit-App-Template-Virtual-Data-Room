# Developer Guide

This guide covers the technical details of the Virtual Data Room (VDR) application — how it's built, how the pieces fit together, and how to set it up for local development.

## Contents

- [Architecture Overview](./architecture.md) — Tech stack, project structure, and how the layers relate
- [Setup & Configuration](./setup-and-configuration.md) — Local development, environment variables, Twinit project setup, and building for deployment
- [Authentication](./authentication.md) — OAuth 2.0 PKCE flow, token storage, and session management
- [Data Model](./data-model.md) — Sections, subsections, documents, and links: how they're structured and related
- [Backend API](./backend-api.md) — OMAPI endpoint reference, backend scripts, and the template package
- [Permissions & Access Control](./permissions.md) — Section user groups, permission sets, and the creation flow
- [Services & State Management](./services-and-state.md) — React Query hooks, cache invalidation strategy, and the service layer
- [Component Reference](./components.md) — Guide to the component tree and each component's role

---

## AI Assistance — Twinit Documentation Skill

This project includes a **Cursor AI skill** for looking up Twinit platform documentation directly from [twinit.dev](https://twinit.dev) without leaving the IDE.

The skill is located at `.cursor/skills/twinit-docs/SKILL.md` and is available automatically to any AI agent running inside Cursor when working in this repository.

**When it's useful:**

- Looking up Twinit platform API methods (`IafPassSvc`, `IafFileSvc`, `IafItemSvc`, etc.)
- Understanding Twinit service concepts, authentication flows, or item types
- Checking available parameters and return shapes for OMAPI or SDK calls
- Exploring the Twinit UI framework (IPA Core React Framework)

The skill fetches documentation as raw markdown from `https://twinit.dev/assets/raw/` and synthesises an answer from the relevant content bundles. You do not need to navigate away from Cursor or search the web manually — ask the AI agent a Twinit-related question and it will use the skill automatically.

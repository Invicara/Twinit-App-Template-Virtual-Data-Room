# Setup & Configuration

## Prerequisites

- Node.js (v18 or later recommended)
- A Twinit account with access to at least one environment (e.g. `sandbox-api.invicara.com`)
- The **Twinit IDE VSCode Extension** (for deploying the template package)
- Twinit **Production** user access keys and the `DTPLATFORM_KEY`, `DTPLATFORM_SECRET_BASE64`, and `DTPLATFORM_EMAIL` environment variables set — required to install `@dtplatform` packages from `npm.twinit.dev` (see the project `.npmrc`)

---

## 1. Clone the Repository

```bash
git clone <repo-url>
cd Twinit-App-Template-Virtual-Data-Room
```

---

## 2. Configure the Twinit Project

Before you can run the client, the target Twinit project must be configured as a Virtual Data Room. This installs the OMAPI endpoint definitions and backend scripts that the client depends on.

1. Open VS Code with the Twinit IDE Extension installed and signed in
2. Create a new Twinit Project (or use an existing one)
3. Right-click the Project in the extension's tree view and select **Deploy Template to Project**
4. When prompted to select a zip file, choose `setup/vdr.zip`

This deploys:
- `VDR-API.json` — the OMAPI routing configuration that maps HTTP endpoints to backend scripts
- `sections-api.mjs` — logic for sections, subsections, and links
- `documents-api.mjs` — logic for document status, versions, and trash
- `search-api.mjs` — full-text search and trash search

See the [Backend API](./backend-api.md) doc for details on what these scripts do.

> **Note:** If you update any backend scripts, re-zip the `setup/template-package-content` folder as `setup/vdr.zip` and re-deploy.

---

## 3. Upload an OpenAI API Key

Document uploads call Twinit's vectorize endpoint so files can be embedded for search. That step requires an OpenAI API key stored as a secret on the workspace (namespace).

1. Right click on the Twinit project you configured in step 2
2. Select **Upload AI Key**
3. In the page that opens select **OPEN AI** 
4. Set the secret value to your OpenAI API key and save it 

Files are automatically vectorized on upload, though the resulting knowledgebases are not yet used. Embedding was implemented with an intent of future utilization. Automatic embeddings can be disabled by commenting out the ```/vectorize``` api request in ```_postProcessDocument``` in ```src/services/useDocuments.js```.

> See [AI Service overview](https://twinit.dev/docs/concepts/back-end-services/ai-service/ai_service_overview/) for how the platform uses this key.

---

## 4. Create a Local Environment File

Create a `.env.local` file in the project root:

```env
VITE_TWINIT_API=https://sandbox-api.invicara.com
VITE_TWINIT_APP_ID=<your-oauth-app-id>
```

| Variable | Description |
|---|---|
| `VITE_TWINIT_API` | Base URL for the Twinit API environment you want to connect to |
| `VITE_TWINIT_APP_ID` | The OAuth client ID registered for this application in Twinit |

> The `.env.local` file is git-ignored and should never be committed.

---

## 5. Install Dependencies & Run

> `@dtplatform` packages resolve from `https://npm.twinit.dev/`. Ensure `DTPLATFORM_KEY`, `DTPLATFORM_SECRET_BASE64`, and `DTPLATFORM_EMAIL` are set in your environment before running `npm install`, or the install will fail with 401/403.

```bash
npm install
npm run dev
```

The dev server starts (Vite defaults to `http://localhost:8088/`) and opens the application in your browser. The app immediately redirects to Twinit's OAuth sign-in if no access token is present in `localStorage`.

---

## 6. Selecting a Room on First Sign-In

After signing in, if your account belongs to multiple Twinit projects you will be presented with a **Room Picker** dialog. Select the project you configured in step 2.

The selected project is stored in `sessionStorage` under the key `twinit_selected_project`, so it persists across page refreshes within the same browser tab but is cleared when the tab is closed.

---

## Building for Deployment

```bash
npm run build
```

This produces a `dist/` folder containing the compiled static assets.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Compile and bundle the application for production |
| `npm run preview` | Serve the production build locally for inspection |
| `npm run lint` | Run ESLint across all source files |

---

## Keeping the Template Package Up-to-Date

Whenever you change any backend scripts or the API config, regenerate the zip:

```bash
cd setup
zip -r vdr.zip template-package-content/
```

Then re-deploy to any Twinit projects that need the update. This makes it straightforward to spin up a fresh test project at any time with the latest configuration.

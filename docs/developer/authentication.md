# Authentication

The application uses **OAuth 2.0 Authorization Code flow with PKCE** (Proof Key for Code Exchange) against Twinit's passport service. There is no username/password form in the client — authentication is delegated entirely to Twinit.

---

## Flow Overview

```
Browser                          Twinit Passport Service
  │                                        │
  │─── initiateAuth() ────────────────────▶│
  │    (redirect with code_challenge)      │
  │                                        │
  │◀── redirect back with ?code= ─────────│
  │                                        │
  │─── handleAuthCallback(code) ──────────▶│
  │    (POST /oauth/token with verifier)   │
  │                                        │
  │◀── access_token ──────────────────────│
  │                                        │
  │    store token in localStorage        │
  │    IafSession.setAuthToken(token)      │
```

---

## Key Files

| File | Responsibility |
|---|---|
| `src/auth/auth.js` | PKCE helpers, token storage, logout |
| `src/App.jsx` | Orchestrates the auth bootstrap sequence |
| `src/services/apiFetch.js` | Wraps `fetch`; fires a `session-expired` event on 401 |

---

## Step-by-Step

### 1. Initiating Auth — `initiateAuth()`

Called when no access token is found in `localStorage`.

1. A random 64-character **code verifier** is generated using `crypto.getRandomValues()`
2. The verifier is stored in `sessionStorage` under `twinit_code_verifier`
3. A **code challenge** is derived by SHA-256 hashing the verifier and base64url-encoding it
4. The browser is redirected to:
   ```
   {VITE_TWINIT_API}/passportsvc/api/v2/oauth/authorize
     ?client_id=...
     &response_type=code
     &redirect_uri=<current origin + pathname>
     &code_challenge=<challenge>
     &code_challenge_method=S256
   ```

### 2. Handling the Callback — `handleAuthCallback(code)`

Called when the browser returns from the OAuth provider with a `?code=` query parameter.

1. The code verifier is retrieved from `sessionStorage`
2. A `POST` is made to `/passportsvc/api/v2/oauth/token` with:
   - `grant_type: authorization_code`
   - `code` (from the URL)
   - `code_verifier` (from sessionStorage)
3. On success, the **access token** is stored in `localStorage` under `twinit_access_token`
4. The `?code=` parameter is removed from the URL via `history.replaceState`

### 3. Subsequent Loads — `getAccessToken()`

If a token already exists in `localStorage`, the app skips the redirect and calls `IafSession.setAuthToken()` directly, resuming the session immediately.

---

## Session Expiry

The `apiFetch` wrapper inspects every API response. If the response body contains `errorResult.status === 401`, it fires a `session-expired` CustomEvent on the shared `authEvents` EventTarget.

`App.jsx` listens for this event and displays a **Session Expired** overlay. Clicking "Sign In" calls `initiateAuth()` again.

This catches the case where the Twinit platform returns a 200 HTTP status but an application-level 401 inside the response body.

---

## Logout — `logout()`

1. The access token is removed from `localStorage`
2. `IafPassSvc.logout()` is called to invalidate the session server-side
3. `IafSession.deleteSession()` clears the SDK's internal session state
4. The `manage` key is removed from `sessionStorage`

After logout, `window.location.reload()` is called, which triggers the auth flow from the beginning.

---

## Token Storage

| Token | Storage | Lifetime |
|---|---|---|
| Access token | `localStorage` (`twinit_access_token`) | Until explicitly cleared or overwritten |
| Code verifier | `sessionStorage` (`twinit_code_verifier`) | Only during the OAuth redirect round-trip; deleted on successful exchange |
| Selected project | `sessionStorage` (`twinit_selected_project`) | Duration of browser tab session |

> The access token in `localStorage` persists across browser tab closes. This means users stay signed in between sessions unless they explicitly log out.

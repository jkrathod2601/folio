import { useAuthStore } from "@/store/auth";

/**
 * API client.
 *
 * Two credentials, deliberately handled differently:
 *
 *   access token  — short-lived, held in memory by the auth store, sent as a
 *                   Bearer header. Never written to localStorage or a cookie,
 *                   so a page reload costs one silent refresh instead of
 *                   leaving a readable token lying around for XSS to steal.
 *   refresh token — long-lived, httpOnly, invisible to this code. It is sent
 *                   automatically by the browser, so all we can do is ask for a
 *                   new access token when this one expires.
 */

/**
 * API base URL.
 *
 * Empty in development, so requests stay same-origin on :5173 and the Vite
 * proxy forwards them to :4000. That is also what keeps the httpOnly refresh
 * cookie SameSite=Lax over plain http — calling the backend cross-origin from
 * localhost would force SameSite=None; Secure, which browsers reject.
 *
 * In production the frontend (Vercel) and the API (Render) are different
 * origins, so there is no proxy to inherit and VITE_API_URL has to be the
 * absolute backend URL. Deploy-time env var, baked in by `vite build`.
 */
const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "") + "/api";

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// One in-flight refresh shared by every 401, so a burst of parallel requests
// that all expire at once produces one refresh, not one per request.
let refreshInFlight = null;

async function refreshAccessToken() {
  refreshInFlight ??= (async () => {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) throw new ApiError("Session expired", { status: res.status });

    const { accessToken, user } = await res.json();
    useAuthStore.getState().setSession({ accessToken, user });
    return accessToken;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

async function parse(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch(
  path,
  { method = "GET", body, headers: extra, auth = true, retry = true, raw = false, blob = false } = {}
) {
  const headers = { ...extra };

  // `raw` sends the body through untouched, for a file upload. JSON.stringify on
  // a File produces `{}` — the bytes would vanish and the server would get an
  // empty cover. The caller supplies content-type itself in that case.
  if (body !== undefined && !raw) headers["content-type"] = "application/json";

  const accessToken = useAuthStore.getState().accessToken;
  if (auth && accessToken) headers.authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    // Required or the browser drops the refresh cookie on a cross-origin call.
    credentials: "include",
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
  });

  if (res.status === 401 && auth && retry) {
    // The access token expired. Swap it once, then replay the original request.
    try {
      await refreshAccessToken();
      return apiFetch(path, { method, body, headers: extra, auth, retry: false, raw, blob });
    } catch {
      useAuthStore.getState().clear();
      throw new ApiError("Session expired — please sign in again", { status: 401 });
    }
  }

  // A binary response must not go through `parse()`, which reads text and would
  // mangle the bytes. Hand back a Blob for the caller to objectURL.
  if (blob) {
    if (!res.ok) {
      // Errors here are still JSON, so the message survives.
      const err = await parse(res);
      throw new ApiError(err?.error?.message ?? `Request failed (${res.status})`, {
        status: res.status,
        data: err,
      });
    }
    return res.blob();
  }

  const data = await parse(res);

  if (!res.ok) {
    throw new ApiError(data?.error?.message ?? `Request failed (${res.status})`, {
      status: res.status,
      data,
    });
  }

  return data;
}

export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => apiFetch(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => apiFetch(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => apiFetch(path, { ...opts, method: "DELETE" }),
};


/** Full-page navigation to the Google consent screen. */
export function signInWithGoogle() {
  window.location.assign(`${BASE}/auth/google`);
}

/**
 * Silent sign-in on startup.
 *
 * The access token is gone after a reload, but the httpOnly refresh cookie is
 * not. This redeems it for a fresh pair. A failure is the normal signed-out
 * case, not an error worth surfacing, so it resolves quietly.
 */
export async function bootstrapAuth() {
  try {
    await refreshAccessToken();
    return true;
  } catch {
    useAuthStore.getState().clear();
    return false;
  }
}

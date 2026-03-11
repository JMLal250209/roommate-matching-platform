import { clearSession, getTokens, setAuthMessage, setTokens } from "./session";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5001").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, { status = 0, code = "API_ERROR", data = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function buildUrl(path) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}

function buildHeaders({ auth, headers }) {
  const nextHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (auth) {
    const { idToken } = getTokens();
    if (idToken) {
      nextHeaders.Authorization = `Bearer ${idToken}`;
    }
  }

  return nextHeaders;
}

async function doFetch(method, path, { body, auth = false, headers = {} } = {}) {
  const response = await fetch(buildUrl(path), {
    method,
    headers: buildHeaders({ auth, headers }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseJson(response);

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

function resolveErrorMessage(payload, fallbackMessage) {
  if (!payload) return fallbackMessage;
  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.message === "string") return payload.message;
  return fallbackMessage;
}

let refreshInFlight = null;

async function refreshAuthToken() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const { refreshToken } = getTokens();

    if (!refreshToken) {
      throw new ApiError("Session expired. Please sign in again.", {
        status: 401,
        code: "SESSION_EXPIRED",
      });
    }

    const { ok, status, payload } = await doFetch("POST", "/api/auth/refresh", {
      body: { refreshToken },
      auth: false,
    });

    if (!ok || !payload?.data?.idToken) {
      throw new ApiError(resolveErrorMessage(payload, "Session expired. Please sign in again."), {
        status,
        code: "SESSION_EXPIRED",
        data: payload,
      });
    }

    setTokens({
      idToken: payload.data.idToken,
      accessToken: payload.data.accessToken,
      refreshToken,
    });
  })();

  try {
    await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

function handleSessionExpired() {
  clearSession();
  setAuthMessage("Session expired. Please sign in again.");

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("shrmp:session-expired"));
  }
}

export async function request(method, path, options = {}) {
  const { body, auth = false, retryOn401 = true, headers } = options;

  let result = await doFetch(method, path, { body, auth, headers });

  if (result.status === 401 && auth && retryOn401) {
    try {
      await refreshAuthToken();
      result = await doFetch(method, path, { body, auth, headers });
    } catch (err) {
      handleSessionExpired();
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError("Session expired. Please sign in again.", {
        status: 401,
        code: "SESSION_EXPIRED",
      });
    }
  }

  if (!result.ok) {
    throw new ApiError(resolveErrorMessage(result.payload, "Request failed."), {
      status: result.status,
      code: result.status === 401 ? "UNAUTHORIZED" : "API_ERROR",
      data: result.payload,
    });
  }

  return result.payload;
}

export { API_BASE_URL };

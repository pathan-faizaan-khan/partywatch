
export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

let getAccessToken: () => string | null = () => null;
let setAccessToken: (token: string | null) => void = () => { };
let getRefreshToken: () => string | null = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("partywatch_refresh_token");
};
let setRefreshToken: (token: string | null) => void = (token) => {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("partywatch_refresh_token", token);
  else localStorage.removeItem("partywatch_refresh_token");
};

export function configureApiAuth(
  getter: () => string | null,
  setter: (token: string | null) => void,
  refreshGetter?: () => string | null,
  refreshSetter?: (token: string | null) => void
) {
  getAccessToken = getter;
  setAccessToken = setter;
  if (refreshGetter) getRefreshToken = refreshGetter;
  if (refreshSetter) setRefreshToken = refreshSetter;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let refreshPromise: Promise<string | null> | null = null;

/**
 * Deduplicated token refresh: all concurrent 401 responses await the SAME in-flight
 * refresh promise rather than spamming multiple parallel /auth/refresh calls.
 */
export async function requestTokenRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const storedRefresh = getRefreshToken();
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefresh }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setAccessToken(null);
          setRefreshToken(null);
        }
        return null;
      }

      const data = await res.json();
      const newToken = data.accessToken;
      if (newToken) {
        setAccessToken(newToken);
        if (data.refreshToken) {
          setRefreshToken(data.refreshToken);
        }
        return newToken as string;
      }
      return null;
    } catch (err) {
      console.warn("Deduplicated token refresh error:", err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface FetchOptions extends RequestInit {
  _retry?: boolean;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const url = endpoint.startsWith("http://") || endpoint.startsWith("https://")
    ? endpoint
    : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const currentToken = getAccessToken();
  if (currentToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${currentToken}`);
  }

  const fetchConfig: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  let response: Response;
  try {
    response = await fetch(url, fetchConfig);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network error. Please check your connection.";
    throw new ApiError(0, errorMsg);
  }

  // Handle 401: attempt a single deduplicated refresh if not already retrying or on auth routes
  if (
    response.status === 401 &&
    !options._retry &&
    !endpoint.includes("/auth/refresh") &&
    !endpoint.includes("/auth/login") &&
    !endpoint.includes("/auth/register")
  ) {
    options._retry = true;
    const newToken = await requestTokenRefresh();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      const retryRes = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      if (!retryRes.ok) {
        const errData = await retryRes.json().catch(() => null);
        throw new ApiError(
          retryRes.status,
          errData?.error || errData?.message || `Request failed with status ${retryRes.status}`,
          errData
        );
      }

      if (retryRes.status === 204) return {} as T;
      return await retryRes.json();
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.error ||
      errorData?.message ||
      (Array.isArray(errorData?.errors) ? errorData.errors[0]?.message : null) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T = unknown>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "GET" }),
  post: <T = unknown>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T = unknown>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = unknown>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: "DELETE" }),
};

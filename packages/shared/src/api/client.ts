export type ApiResult<T> = { ok: true } & T;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type CreateApiClientOptions = {
  /** Absolute API origin without trailing slash, e.g. https://host — empty for same-origin web */
  baseUrl?: string;
  /** Return JWT for Authorization header (mobile). Web cookie auth leaves this unset. */
  getToken?: () => string | null | Promise<string | null>;
  /** Web: "include". Mobile: "omit". */
  credentials?: "include" | "omit" | "same-origin";
};

function joinUrl(baseUrl: string, path: string) {
  if (!baseUrl) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = baseUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function createApiClient(options: CreateApiClientOptions = {}) {
  const baseUrl = options.baseUrl || "";
  const credentials = options.credentials ?? (options.getToken ? "omit" : "include");

  async function apiFetch<T extends object>(
    path: string,
    init?: RequestInit,
  ): Promise<ApiResult<T>> {
    const headers = new Headers(init?.headers || {});
    if (!headers.has("Content-Type") && init?.body) {
      headers.set("Content-Type", "application/json");
    }
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (options.getToken) {
      const token = await options.getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
        headers.set("X-SC-Session", token);
        // Some reverse proxies drop Authorization; cookie auth still works.
        if (!headers.has("Cookie")) {
          headers.set("Cookie", `sc_session=${token}`);
        }
      }
    }

    const res = await fetch(joinUrl(baseUrl, path), {
      ...init,
      headers,
      credentials,
    });

    let body: { ok?: boolean; error?: string } & T;
    try {
      body = (await res.json()) as typeof body;
    } catch {
      throw new ApiError(`Invalid response from ${path}`, res.status);
    }

    if (!res.ok || body.ok === false) {
      const msg =
        body.error ||
        (body as { message?: string }).message ||
        `Request failed (${res.status})`;
      throw new ApiError(msg, res.status);
    }

    return body as ApiResult<T>;
  }

  async function isBackendReady(): Promise<boolean> {
    try {
      const res = await fetch(joinUrl(baseUrl, "/api/health"), { credentials });
      if (!res.ok) return false;
      const body = (await res.json()) as { mongo?: boolean };
      return Boolean(body.mongo);
    } catch {
      return false;
    }
  }

  return { apiFetch, isBackendReady, baseUrl };
}

/** Default same-origin web client (cookies). */
const defaultClient = createApiClient({ credentials: "include" });

export const apiFetch = defaultClient.apiFetch;
export const isBackendReady = defaultClient.isBackendReady;

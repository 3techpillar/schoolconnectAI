export type ApiResult<T> = { ok: true } & T;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T extends object>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });

  let body: { ok?: boolean; error?: string } & T;
  try {
    body = (await res.json()) as typeof body;
  } catch {
    throw new ApiError(`Invalid response from ${path}`, res.status);
  }

  if (!res.ok || body.ok === false) {
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status);
  }

  return body as ApiResult<T>;
}

/** True when MongoDB is configured and reachable via /api/health. */
export async function isBackendReady(): Promise<boolean> {
  try {
    const res = await fetch("/api/health", { credentials: "include" });
    if (!res.ok) return false;
    const body = (await res.json()) as { mongo?: boolean };
    return Boolean(body.mongo);
  } catch {
    return false;
  }
}

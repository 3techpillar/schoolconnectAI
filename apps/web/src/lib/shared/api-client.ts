import {
  createApiClient,
  ApiError,
  type ApiResult,
} from "@schoolconnect/shared";

export { ApiError };
export type { ApiResult };

const client = createApiClient({
  credentials: "include",
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
});

export const apiFetch = client.apiFetch;
export const isBackendReady = client.isBackendReady;

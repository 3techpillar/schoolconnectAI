import {
  createApiClient,
  ApiError,
  type ApiResult,
} from "@schoolconnect/shared";

export { ApiError };
export type { ApiResult };

const client = createApiClient({ credentials: "include", baseUrl: "" });

export const apiFetch = client.apiFetch;
export const isBackendReady = client.isBackendReady;

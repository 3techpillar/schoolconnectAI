/**
 * Mobile runtime config.
 * Edit MODE or API_BASE_URL_OVERRIDE for local devices.
 * (React Native does not load .env unless a babel plugin is added.)
 */
import {Platform} from 'react-native';

export type ApiMode = 'staging' | 'local';

/** Switch to 'local' when `npm run dev:web` is running with API_PROXY_ENABLED=false */
export const API_MODE: ApiMode = 'staging';

const STAGING_URL = 'https://schconnectai.3techpillar.com';

const LOCAL_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://127.0.0.1:3000';

/** Optional hard override — wins over MODE when set */
export const API_BASE_URL_OVERRIDE: string | null = null;

export function resolveApiBaseUrl(): string {
  if (API_BASE_URL_OVERRIDE?.trim()) return API_BASE_URL_OVERRIDE.trim().replace(/\/$/, '');
  return API_MODE === 'local' ? LOCAL_URL : STAGING_URL;
}

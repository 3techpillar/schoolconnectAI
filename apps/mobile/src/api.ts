import {
  createApiClient,
  createAppConfig,
  theme as designTheme,
} from '@schoolconnect/shared';
import {getToken} from './auth/tokenStorage';
import {resolveApiBaseUrl} from './config';

export const API_BASE_URL = resolveApiBaseUrl();

export const appConfig = createAppConfig({
  env: 'development',
  name: 'SchoolConnect AI',
  url: API_BASE_URL,
  demoMode: true,
  demoOtp: '000000',
});

export const theme = designTheme;

export const {apiFetch, isBackendReady} = createApiClient({
  baseUrl: API_BASE_URL,
  credentials: 'omit',
  getToken,
});

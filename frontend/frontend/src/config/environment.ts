const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''

export const environment = {
  // An empty base URL uses the Vite proxy in local development and avoids the
  // browser-side CORS restriction while the backend CORS middleware is absent.
  apiBaseUrl: configuredApiBaseUrl.replace(/\/$/, ''),
  // Real backend integration is the default. Set VITE_MOCK_ENABLED=true only
  // when the backend is intentionally unavailable during UI development.
  useMock: import.meta.env.VITE_MOCK_ENABLED === 'true',
} as const

export const environment = { apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000', 
    useMock: import.meta.env.VITE_MOCK_ENABLED !== 'false', 
} as const
import type { User } from '../types'
import { apiRequest } from './apiClient'

export const ACCESS_TOKEN_KEY = 'safeflow_access_token'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegistrationData extends LoginCredentials {
  first_name: string
  last_name: string
  bank_name: string
  country: string
  password_confirm: string
}

interface TokenResponse {
  access_token: string
  token_type: string
}

export async function registerUser(data: RegistrationData): Promise<User> {
  return apiRequest<User>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function loginUser(
  credentials: LoginCredentials,
): Promise<TokenResponse> {
  const response = await apiRequest<TokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token)

  return response
}

export async function getCurrentUser(token: string): Promise<User> {
  return apiRequest<User>('/api/v1/auth/me', { token })
}

export function getStoredToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function clearStoredToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

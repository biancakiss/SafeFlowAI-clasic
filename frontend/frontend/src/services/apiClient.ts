import { environment } from '../config/environment'

export class ApiError extends Error {
  public readonly status: number

  constructor(
    message: string,
    status: number,
  ) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

type ApiRequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: HeadersInit
  token?: string
}

export async function apiRequest<T>(
  path: string,
  { headers: customHeaders, token, ...options }: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(customHeaders)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${environment.apiBaseUrl}${path}`, {
    ...options,
    headers,
  })

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json')

  const body = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'detail' in body
        ? String(body.detail)
        : 'Request failed. Please try again.'

    throw new ApiError(message, response.status)
  }

  return body as T
}
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
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 10_000

function getErrorMessage(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'detail' in body) {
    const detail = body.detail

    if (typeof detail === 'string') {
      return detail
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === 'object' && item !== null && 'msg' in item) {
            return String(item.msg)
          }

          return String(item)
        })
        .join(' ')
    }
  }

  return 'Request failed. Please try again.'
}

export async function apiRequest<T>(
  path: string,
  {
    headers: customHeaders,
    token,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...options
  }: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(customHeaders)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    const response = await fetch(`${environment.apiBaseUrl}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    const responseText = await response.text()
    let body: unknown = responseText

    if (responseText.length > 0) {
      try {
        body = JSON.parse(responseText)
      } catch {
        body = responseText
      }
    }

    if (!response.ok) {
      throw new ApiError(getErrorMessage(body), response.status)
    }

    return body as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(
        'The backend did not respond in time. Please try again.',
        0,
      )
    }

    throw new ApiError(
      'The backend is unavailable. Please check that it is running and try again.',
      0,
    )
  } finally {
    clearTimeout(timeoutId)
  }
}

import type { RiskLevel } from '../types'
import { apiRequest } from './apiClient'
import { ACCESS_TOKEN_KEY } from './authService'

export type NotificationKind = 'notification' | 'reminder'

export interface NotificationItem {
  id: string
  backendId?: number
  kind: NotificationKind
  title: string
  message: string
  isRead: boolean
  needsAction: boolean
  transactionId?: string
  transactionDbId?: number
  riskLevel?: RiskLevel
  riskScore?: number
  createdAt: string
}

interface BackendNotification {
  id: number
  user_id: number
  transaction_db_id: number | null
  transaction_id?: string | null
  title: string
  message: string
  is_read: boolean
  created_at: string
}

interface BackendActionRequiredNotification {
  key: string
  transaction_db_id: number
  transaction_id: string
  title: string
  message: string
  risk_score?: number | null
  risk_level?: string | null
  created_at: string
}

interface MarkAllReadResponse {
  updated: number
}

function getToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined
}

function normalizeRiskLevel(value?: string | null): RiskLevel | undefined {
  if (value?.toUpperCase() === 'HIGH') return 'HIGH'
  if (value?.toUpperCase() === 'MEDIUM') return 'MEDIUM'
  if (value?.toUpperCase() === 'LOW') return 'LOW'
  return undefined
}

function mapNotification(value: BackendNotification): NotificationItem {
  return {
    id: `notification:${value.id}`,
    backendId: value.id,
    kind: 'notification',
    title: value.title,
    message: value.message,
    isRead: value.is_read,
    needsAction: false,
    transactionId: value.transaction_id ?? undefined,
    transactionDbId: value.transaction_db_id ?? undefined,
    createdAt: value.created_at,
  }
}

function mapActionRequiredNotification(
  value: BackendActionRequiredNotification,
): NotificationItem {
  return {
    id: `reminder:${value.key}`,
    kind: 'reminder',
    title: value.title,
    message: value.message,
    isRead: false,
    needsAction: true,
    transactionId: value.transaction_id,
    transactionDbId: value.transaction_db_id,
    riskLevel: normalizeRiskLevel(value.risk_level),
    riskScore: value.risk_score ?? undefined,
    createdAt: value.created_at,
  }
}

export function mergeNotificationItems(
  notifications: NotificationItem[],
  reminders: NotificationItem[],
): NotificationItem[] {
  return [...notifications, ...reminders].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() -
      new Date(left.createdAt).getTime(),
  )
}

export async function getNotifications(
  limit = 50,
): Promise<NotificationItem[]> {
  const response = await apiRequest<BackendNotification[]>(
    `/api/v1/notifications?limit=${limit}`,
    { token: getToken() },
  )

  return response.map(mapNotification)
}

export async function getUnreadNotifications(
  limit = 100,
): Promise<NotificationItem[]> {
  const response = await apiRequest<BackendNotification[]>(
    `/api/v1/notifications/unread?limit=${limit}`,
    { token: getToken() },
  )

  return response.map(mapNotification)
}

export async function getActionRequiredNotifications(
  limit = 100,
): Promise<NotificationItem[]> {
  const response = await apiRequest<BackendActionRequiredNotification[]>(
    `/api/v1/notifications/action-required?limit=${limit}`,
    { token: getToken() },
  )

  return response.map(mapActionRequiredNotification)
}

export async function markNotificationRead(
  notificationId: number,
): Promise<NotificationItem> {
  const response = await apiRequest<BackendNotification>(
    `/api/v1/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
      token: getToken(),
    },
  )

  return mapNotification(response)
}

export async function markAllNotificationsRead(): Promise<number> {
  const response = await apiRequest<MarkAllReadResponse>(
    '/api/v1/notifications/read-all',
    {
      method: 'PATCH',
      token: getToken(),
    },
  )

  return response.updated
}

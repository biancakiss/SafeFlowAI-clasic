import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router'

import { PageHeader } from '../components/common/PageHeader'
import {
  getActionRequiredNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  mergeNotificationItems,
} from '../services/notificationService'
import type { NotificationItem } from '../services/notificationService'

type NotificationFilter = 'all' | 'unread' | 'needs-action'

function formatNotificationDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getRiskChipColor(level?: NotificationItem['riskLevel']) {
  if (level === 'HIGH') return 'error'
  if (level === 'MEDIUM') return 'warning'
  return 'success'
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadNotifications = async () => {
    setLoading(true)
    setError('')

    try {
      const [notifications, reminders] = await Promise.all([
        getNotifications(100),
        getActionRequiredNotifications(100),
      ])

      setItems(mergeNotificationItems(notifications, reminders))
    } catch (notificationError) {
      setError(
        notificationError instanceof Error
          ? notificationError.message
          : 'Notifications could not be loaded.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    setActionLoading(true)
    setError('')

    try {
      await markAllNotificationsRead()
      setItems((current) =>
        current.map((item) =>
          item.kind === 'notification'
            ? { ...item, isRead: true }
            : item,
        ),
      )
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : 'Notifications could not be marked as read.',
      )
    } finally {
      setActionLoading(false)
    }
  }

  const handleItemClick = async (item: NotificationItem) => {
    if (item.backendId !== undefined && !item.isRead) {
      try {
        await markNotificationRead(item.backendId)
        setItems((current) =>
          current.map((currentItem) =>
            currentItem.id === item.id
              ? { ...currentItem, isRead: true }
              : currentItem,
          ),
        )
      } catch (markError) {
        setError(
          markError instanceof Error
            ? markError.message
            : 'The notification could not be marked as read.',
        )
      }
    }

    if (item.transactionId) {
      navigate(`/analyses/${encodeURIComponent(item.transactionId)}`)
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter === 'unread') return !item.isRead
    if (filter === 'needs-action') return item.needsAction
    return true
  })

  const unreadCount = items.filter((item) => !item.isRead).length
  const needsActionCount = items.filter((item) => item.needsAction).length
  const hasReadNotifications = items.some(
    (item) => item.kind === 'notification' && !item.isRead,
  )

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Notifications"
        description="Review recent activity and payments that still need your decision."
        action={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              onClick={() => void loadNotifications()}
              disabled={loading || actionLoading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleMarkAllRead()}
              disabled={!hasReadNotifications || actionLoading}
            >
              Mark all as read
            </Button>
          </Stack>
        }
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Tabs
            value={filter}
            onChange={(_, value: NotificationFilter) => setFilter(value)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab value="all" label={`All (${items.length})`} />
            <Tab value="unread" label={`Unread (${unreadCount})`} />
            <Tab value="needs-action" label={`Needs action (${needsActionCount})`} />
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          {loading ? (
            <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          ) : filteredItems.length === 0 ? (
            <Box sx={{ py: 7, textAlign: 'center' }}>
              <Typography variant="h3">Nothing to show</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {filter === 'needs-action'
                  ? 'There are no payments waiting for a decision.'
                  : 'There are no notifications in this view.'}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredItems.map((item, index) => (
                <ListItemButton
                  key={item.id}
                  onClick={() => void handleItemClick(item)}
                  divider={index < filteredItems.length - 1}
                  sx={{
                    alignItems: 'flex-start',
                    gap: 1.5,
                    px: { xs: 1, sm: 1.5 },
                    py: 2,
                    borderRadius: 2,
                    backgroundColor: item.needsAction
                      ? 'rgba(255, 193, 7, 0.08)'
                      : item.isRead
                        ? 'transparent'
                        : 'rgba(11, 151, 140, 0.07)',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      mt: 1,
                      flexShrink: 0,
                      borderRadius: '50%',
                      backgroundColor: item.isRead ? 'transparent' : '#0B978C',
                    }}
                  />
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: item.isRead ? 600 : 750, color: '#0B1F3A' }}>
                        {item.title}
                      </Typography>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'block' }}>
                        <Typography component="span" variant="body2" sx={{ display: 'block', mt: 0.5, color: '#5D6B82' }}>
                          {item.message}
                        </Typography>
                        <Typography component="span" variant="caption" sx={{ display: 'block', mt: 0.75, color: '#8792A5' }}>
                          {formatNotificationDate(item.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-end', sm: 'center' }, gap: 1, ml: 1 }}>
                    {item.needsAction && <Chip label="Needs action" size="small" color="warning" />}
                    {item.riskLevel && (
                      <Chip
                        label={`${item.riskLevel} risk`}
                        size="small"
                        color={getRiskChipColor(item.riskLevel)}
                        variant="outlined"
                      />
                    )}
                  </Box>
                </ListItemButton>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}

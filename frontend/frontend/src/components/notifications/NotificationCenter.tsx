import { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import { useNavigate } from 'react-router'

import {
  getActionRequiredNotifications,
  getNotifications,
  getUnreadNotifications,
  markNotificationRead,
  mergeNotificationItems,
} from '../../services/notificationService'
import type { NotificationItem } from '../../services/notificationService'

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

export function NotificationCenter() {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshNotifications = async () => {
    setLoading(true)
    setError('')

    try {
      const [recent, unread, reminders] = await Promise.all([
        getNotifications(5),
        getUnreadNotifications(100),
        getActionRequiredNotifications(100),
      ])

      const combined = mergeNotificationItems(recent, reminders)
      const unreadIds = new Set([
        ...unread.map((item) => item.id),
        ...reminders.map((item) => item.id),
      ])

      setItems(combined.slice(0, 5))
      setUnreadCount(unreadIds.size)
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
    void refreshNotifications()
  }, [])

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    void refreshNotifications()
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
        setUnreadCount((current) => Math.max(0, current - 1))
      } catch {
        setError('The notification could not be marked as read.')
      }
    }

    if (item.transactionId) {
      setAnchorEl(null)
      navigate(`/analyses/${encodeURIComponent(item.transactionId)}`)
    }
  }

  const handleViewAll = () => {
    setAnchorEl(null)
    navigate('/notifications')
  }

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          onClick={handleOpen}
        >
          <Badge
            color="error"
            badgeContent={unreadCount > 99 ? '99+' : unreadCount}
          >
            <NotificationsNoneRoundedIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ width: { xs: 330, sm: 410 }, maxWidth: 'calc(100vw - 32px)' }}>
          <Box sx={{ px: 2, py: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 750 }}>Notifications</Typography>
              <Typography variant="caption" color="text.secondary">
                Recent activity and payments that need your decision
              </Typography>
            </Box>
            {unreadCount > 0 && (
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                {unreadCount} unread
              </Typography>
            )}
          </Box>
          <Divider />

          {loading ? (
            <Box sx={{ py: 5, display: 'grid', placeItems: 'center' }}>
              <CircularProgress size={26} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : items.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 4, textAlign: 'center' }}>
              You have no notifications yet.
            </Typography>
          ) : (
            <List disablePadding>
              {items.map((item) => (
                <ListItemButton
                  key={item.id}
                  onClick={() => void handleItemClick(item)}
                  sx={{
                    alignItems: 'flex-start',
                    gap: 1,
                    px: 2,
                    py: 1.5,
                    backgroundColor: item.needsAction
                      ? 'rgba(255, 193, 7, 0.08)'
                      : item.isRead
                        ? 'transparent'
                        : 'rgba(11, 151, 140, 0.07)',
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography noWrap sx={{ fontWeight: item.isRead ? 600 : 750, color: '#0B1F3A' }}>
                        {item.title}
                      </Typography>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'block' }}>
                        <Typography component="span" variant="body2" sx={{ display: 'block', mt: 0.35, color: '#5D6B82' }}>
                          {item.message}
                        </Typography>
                        <Typography component="span" variant="caption" sx={{ display: 'block', mt: 0.65, color: '#8792A5' }}>
                          {formatNotificationDate(item.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  {item.needsAction && (
                    <Typography variant="caption" sx={{ flexShrink: 0, mt: 0.25, color: '#A15C00', fontWeight: 700 }}>
                      Action
                    </Typography>
                  )}
                </ListItemButton>
              ))}
            </List>
          )}

          <Divider />
          <Box sx={{ p: 1.25 }}>
            <Button fullWidth onClick={handleViewAll}>
              View all notifications
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  )
}

import { useState } from 'react'
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { BrandMark } from '../common/BrandMark'
import { useAuth } from '../../context/AuthContext'
import MarkEmailUnreadRoundedIcon from '@mui/icons-material/MarkEmailUnreadRounded'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'

const drawerWidth = 252

const navigation = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardRoundedIcon },
  { label: 'Analyze payment', path: '/analyze', icon: PaymentsRoundedIcon },
  {
    label: 'Message analysis',
    path: '/message-analysis',
    icon: MarkEmailUnreadRoundedIcon,
  },
  {
    label: 'URL analysis',
    path: '/url-analysis',
    icon: LinkRoundedIcon,
  },
  { label: 'Transactions', path: '/transactions', icon: ReceiptLongRoundedIcon },
  { label: 'Profile', path: '/profile', icon: PersonRoundedIcon },
]

interface DrawerContentProps {
  onNavigate: () => void
}

function DrawerContent({ onNavigate }: DrawerContentProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const displayName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(' ') || 'SafeFlow analyst'
  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || 'SF'

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        color: '#FFFFFF',
        background: 'linear-gradient(180deg, #0B1728 0%, #0C2130 100%)',
      }}
    >
      <Box sx={{ px: 2.5, py: 2.25 }}>
        <BrandMark dark />
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Typography
        variant="overline"
        sx={{ px: 2.5, pt: 2.5, pb: 1, color: 'rgba(255,255,255,0.42)' }}
      >
        Workspace
      </Typography>
      <List sx={{ px: 1.25, py: 0 }}>
        {navigation.map((item) => {
          const selected = location.pathname.startsWith(item.path)
          const Icon = item.icon

          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              selected={selected}
              onClick={onNavigate}
              sx={{
                minHeight: 46,
                mb: 0.5,
                borderRadius: 2.5,
                color: selected ? '#FFFFFF' : 'rgba(255,255,255,0.68)',
                '& .MuiListItemIcon-root': { color: 'inherit' },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(86, 215, 201, 0.14)',
                  '&:hover': { backgroundColor: 'rgba(86, 215, 201, 0.18)' },
                },
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <Typography sx={{ fontSize: 14, fontWeight: selected ? 650 : 500 }}>
                {item.label}
              </Typography>
            </ListItemButton>
          )
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box
        sx={{
          m: 1.5,
          p: 1.5,
          borderRadius: 2.5,
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#2BB6A8', fontSize: 13 }}>
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 650 }}>
              {displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }} noWrap>
              {user?.bank_name ?? 'Risk analyst'}
            </Typography>
          </Box>
          <Tooltip title="Sign out">
            <IconButton
              size="small"
              aria-label="Sign out"
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
              sx={{ color: 'rgba(255,255,255,0.6)' }}
            >
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )
}

export function AppShell() {
  const theme = useTheme()
  const desktop = useMediaQuery(theme.breakpoints.up('lg'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()
  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || 'SF'

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant={desktop ? 'permanent' : 'temporary'}
        open={desktop || mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: desktop ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            border: 0,
          },
        }}
      >
        <DrawerContent onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <Toolbar sx={{ minHeight: '68px !important', px: { xs: 2, md: 3.5 } }}>
            {!desktop && (
              <IconButton
                edge="start"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 1 }}
              >
                <MenuRoundedIcon />
              </IconButton>
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary">
                SafeFlow Operations
              </Typography>
            </Box>
            <Tooltip title="Notifications">
              <IconButton aria-label="Notifications">
                <Badge color="error" variant="dot">
                  <NotificationsNoneRoundedIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Avatar sx={{ ml: 1.25, width: 36, height: 36, bgcolor: '#123E4A', fontSize: 13 }}>
              {initials}
            </Avatar>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ p: { xs: 2, sm: 3, xl: 4 }, maxWidth: 1600, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

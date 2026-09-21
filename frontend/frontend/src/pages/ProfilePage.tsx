import { Avatar, Box, Button, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import { PageHeader } from '../components/common/PageHeader'
import { useAuth } from '../context/AuthContext'

export function ProfilePage() {
  const { user } = useAuth()
  const displayName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(' ')
  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase()

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Profile settings"
        description="Manage your analyst details and organization information."
      />
      <Card sx={{ maxWidth: 820 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: { xs: 2.5, md: 3 } } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: '#123E4A' }}>
              {initials || 'SF'}
            </Avatar>
            <Box>
              <Typography variant="h3">{displayName || 'SafeFlow analyst'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Risk analyst · {user?.bank_name || 'SafeFlow'}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            <TextField label="First name" defaultValue={user?.first_name ?? ''} />
            <TextField label="Last name" defaultValue={user?.last_name ?? ''} />
            <TextField label="Work email" defaultValue={user?.email ?? ''} />
            <TextField label="Bank name" defaultValue={user?.bank_name ?? ''} />
            <TextField label="Country" defaultValue={user?.country ?? ''} />
            <TextField label="Role" defaultValue="Risk analyst" disabled />
          </Box>
          <Button variant="contained" startIcon={<SaveRoundedIcon />} sx={{ mt: 3 }}>
            Save changes
          </Button>
        </CardContent>
      </Card>
    </Stack>
  )
}

import { Avatar, Box, Button, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import { PageHeader } from '../components/common/PageHeader'

export function ProfilePage() {
  return (
    <Stack spacing={3}>
      <PageHeader
        title="Profile settings"
        description="Manage your analyst details and organization information."
      />
      <Card sx={{ maxWidth: 820 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: { xs: 2.5, md: 3 } } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: '#123E4A' }}>DP</Avatar>
            <Box>
              <Typography variant="h3">Darius Pop</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Risk analyst · SafeFlow Demo Bank
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
            <TextField label="First name" defaultValue="Darius" />
            <TextField label="Last name" defaultValue="Pop" />
            <TextField label="Work email" defaultValue="analyst@safeflow.ai" />
            <TextField label="Bank name" defaultValue="SafeFlow Demo Bank" />
            <TextField label="Country" defaultValue="Romania" />
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

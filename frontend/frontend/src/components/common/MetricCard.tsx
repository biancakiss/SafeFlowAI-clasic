import type { ReactNode } from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'

interface MetricCardProps {
  title: string
  value: string
  change: string
  helper: string
  icon: ReactNode
  color: string
  backgroundColor: string
}

export function MetricCard({
  title,
  value,
  change,
  helper,
  icon,
  color,
  backgroundColor,
}: MetricCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 550 }}>
              {title}
            </Typography>
            <Typography
              sx={{ mt: 1, fontSize: '1.75rem', lineHeight: 1.2, fontWeight: 750 }}
            >
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 42,
              height: 42,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              borderRadius: 2.5,
              color,
              backgroundColor,
            }}
          >
            {icon}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
          <TrendingUpRoundedIcon sx={{ fontSize: 17, color: 'success.main' }} />
          <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
            {change}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {helper}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

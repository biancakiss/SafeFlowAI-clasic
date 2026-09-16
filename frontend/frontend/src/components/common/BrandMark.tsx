import { Box, Typography } from '@mui/material'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'

interface BrandMarkProps {
  compact?: boolean
  dark?: boolean
}

export function BrandMark({ compact = false, dark = false }: BrandMarkProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 2.5,
          color: '#072826',
          background: 'linear-gradient(145deg, #7DE5D9, #2BB6A8)',
          boxShadow: '0 8px 22px rgba(43, 182, 168, 0.25)',
        }}
      >
        <ShieldRoundedIcon fontSize="small" />
      </Box>
      {!compact && (
        <Box>
          <Typography
            sx={{
              color: dark ? '#FFFFFF' : 'text.primary',
              fontWeight: 750,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            SafeFlow AI
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: dark ? 'rgba(255,255,255,0.55)' : 'text.secondary' }}
          >
            Payment protection
          </Typography>
        </Box>
      )}
    </Box>
  )
}

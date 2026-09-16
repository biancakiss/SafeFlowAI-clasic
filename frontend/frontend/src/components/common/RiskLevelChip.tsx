import { Chip } from '@mui/material'
import type { RiskLevel } from '../../types'

interface RiskLevelChipProps {
  level: RiskLevel
}

const config = {
  LOW: { label: 'Low risk', color: '#16794B', backgroundColor: '#EAF8F0' },
  MEDIUM: { label: 'Medium risk', color: '#A65A12', backgroundColor: '#FFF4E5' },
  HIGH: { label: 'High risk', color: '#C43D3D', backgroundColor: '#FDECEC' },
} as const

export function RiskLevelChip({ level }: RiskLevelChipProps) {
  const style = config[level]

  return (
    <Chip
      size="small"
      label={style.label}
      sx={{
        color: style.color,
        backgroundColor: style.backgroundColor,
        borderRadius: 2,
      }}
    />
  )
}

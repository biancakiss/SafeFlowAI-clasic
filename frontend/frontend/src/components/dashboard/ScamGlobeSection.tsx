import { lazy, Suspense, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Box,
  Card,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded'
import RouteRoundedIcon from '@mui/icons-material/RouteRounded'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import type { GlobeLocation, RiskLevel, ScamRoute } from '../../types'

const ScamGlobe = lazy(() =>
  import('./ScamGlobe').then((module) => ({ default: module.ScamGlobe })),
)

const riskColors: Record<RiskLevel, string> = {
  LOW: '#4FD1B5',
  MEDIUM: '#F7B955',
  HIGH: '#FF6B6B',
}

interface ScamGlobeSectionProps {
  routes: ScamRoute[]
  locations: GlobeLocation[]
}

const generatedScenarios = [
  {
    scamType: 'Investment scam',
    summary: 'High-pressure payment language and an unfamiliar cross-border beneficiary increased the assessed risk.',
  },
  {
    scamType: 'Business impersonation',
    summary: 'The payment pattern resembles an invoice-change request requiring beneficiary verification.',
  },
  {
    scamType: 'Marketplace scam',
    summary: 'The corridor contains repeated consumer payments with limited beneficiary history.',
  },
  {
    scamType: 'Remote-access scam',
    summary: 'The scenario combines an unusual destination with customer-authorized payment pressure.',
  },
  {
    scamType: 'Advance-fee scam',
    summary: 'The payment resembles an advance request made before the promised service is delivered.',
  },
]

function pairSeed(source: GlobeLocation, target: GlobeLocation) {
  return `${source.country}:${target.country}`
    .split('')
    .reduce((seed, character) => (seed * 31 + character.charCodeAt(0)) % 9973, 17)
}

function createGeneratedRoute(
  source: GlobeLocation,
  target: GlobeLocation,
): ScamRoute {
  const seed = pairSeed(source, target)
  const riskScore = 18 + (seed % 78)
  const riskLevel: RiskLevel =
    riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW'
  const scenario = generatedScenarios[seed % generatedScenarios.length]
  const exposureK = 120 + ((seed * 13) % 2880)

  return {
    id: `generated-${source.country}-${target.country}`,
    source,
    target,
    riskLevel,
    riskScore,
    scamType: scenario.scamType,
    reports: 24 + ((seed * 7) % 210),
    exposure:
      exposureK >= 1000
        ? `€${(exposureK / 1000).toFixed(1)}M`
        : `€${exposureK}K`,
    summary: scenario.summary,
  }
}

export function ScamGlobeSection({ routes, locations }: ScamGlobeSectionProps) {
  const [selectedRoute, setSelectedRoute] = useState<ScamRoute>(routes[0])
  const [supportsWebGL] = useState(() => {
    try {
      const canvas = document.createElement('canvas')
      return Boolean(
        window.WebGLRenderingContext &&
          (canvas.getContext('webgl2') || canvas.getContext('webgl')),
      )
    } catch {
      return false
    }
  })

  const visibleRoutes = useMemo(
    () =>
      routes.some((route) => route.id === selectedRoute.id)
        ? routes
        : [...routes, selectedRoute],
    [routes, selectedRoute],
  )

  const selectCountries = (sourceCountry: string, targetCountry: string) => {
    const source = locations.find(
      (location) => location.country === sourceCountry,
    )
    const target = locations.find(
      (location) => location.country === targetCountry,
    )

    if (!source || !target || source.country === target.country) {
      return
    }

    const predefinedRoute = routes.find(
      (route) =>
        route.source.country === source.country &&
        route.target.country === target.country,
    )

    setSelectedRoute(
      predefinedRoute ?? createGeneratedRoute(source, target),
    )
  }

  const handleSourceChange = (sourceCountry: string) => {
    if (sourceCountry !== selectedRoute.target.country) {
      selectCountries(sourceCountry, selectedRoute.target.country)
      return
    }

    const alternativeTarget = locations.find(
      (location) => location.country !== sourceCountry,
    )

    if (alternativeTarget) {
      selectCountries(sourceCountry, alternativeTarget.country)
    }
  }

  const handleTargetChange = (targetCountry: string) => {
    if (targetCountry !== selectedRoute.source.country) {
      selectCountries(selectedRoute.source.country, targetCountry)
    }
  }

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        color: '#FFFFFF',
        border: 0,
        background:
          'radial-gradient(circle at 26% 45%, rgba(28, 172, 160, 0.14), transparent 28%), radial-gradient(circle at 82% 8%, rgba(64, 105, 185, 0.18), transparent 30%), linear-gradient(135deg, #071724 0%, #0A2230 56%, #0B2932 100%)',
        boxShadow: '0 18px 48px rgba(11, 32, 46, 0.18)',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'linear-gradient(to right, black, transparent 76%)',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.55fr) minmax(310px, 0.75fr)' },
          minHeight: { xs: 0, lg: 520 },
        }}
      >
        <Box sx={{ minWidth: 0, p: { xs: 2.5, md: 3 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Box>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 2.5,
                    color: '#8EEDE1',
                    backgroundColor: 'rgba(79,209,181,0.11)',
                    border: '1px solid rgba(126,231,218,0.16)',
                  }}
                >
                  <LanguageRoundedIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="h2" color="inherit">
                    Global scam intelligence
                  </Typography>
                  <Typography sx={{ mt: 0.25, color: 'rgba(255,255,255,0.56)', fontSize: 13 }}>
                    Explore simulated cross-border payment risk patterns
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Chip
              size="small"
              label="Demo dataset"
              sx={{
                color: '#BDF7EF',
                border: '1px solid rgba(126,231,218,0.22)',
                backgroundColor: 'rgba(79,209,181,0.1)',
              }}
            />
          </Stack>

          <Box sx={{ mt: 0.5, mx: { xs: -2.5, md: -3 }, mb: { xs: -1, md: -2 } }}>
            {supportsWebGL ? (
              <Suspense
                fallback={
                  <Box sx={{ height: 460, display: 'grid', placeItems: 'center' }}>
                    <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
                      <CircularProgress size={28} sx={{ color: '#63D9CB' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.56)' }}>
                        Loading global view...
                      </Typography>
                    </Stack>
                  </Box>
                }
              >
                <ScamGlobe
                  routes={visibleRoutes}
                  selectedRouteId={selectedRoute.id}
                  onSelectRoute={setSelectedRoute}
                />
              </Suspense>
            ) : (
              <Box sx={{ height: 460, display: 'grid', placeItems: 'center', textAlign: 'center', px: 3 }}>
                <Box>
                  <LanguageRoundedIcon sx={{ fontSize: 42, color: '#63D9CB' }} />
                  <Typography sx={{ mt: 1.5, fontWeight: 650 }}>
                    3D view unavailable
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75, color: 'rgba(255,255,255,0.52)' }}>
                    Enable WebGL to explore the interactive scam corridors.
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          <Stack
            direction="row"
            spacing={2.25}
            useFlexGap
            sx={{ color: 'rgba(255,255,255,0.68)', flexWrap: 'wrap' }}
          >
            {(Object.keys(riskColors) as RiskLevel[]).map((level) => (
              <Stack key={level} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: riskColors[level],
                    boxShadow: `0 0 10px ${riskColors[level]}`,
                  }}
                />
                <Typography variant="caption" color="inherit">
                  {level.charAt(0) + level.slice(1).toLowerCase()} risk
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            m: { xs: 2, lg: 2.5 },
            ml: { lg: 0 },
            p: { xs: 2.25, md: 2.5 },
            alignSelf: 'stretch',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(7, 23, 36, 0.72)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <Stack sx={{ height: '100%' }}>
            <Box>
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.42)', letterSpacing: '0.1em' }}>
                Selected corridor
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
                  gap: 1,
                  alignItems: 'center',
                  mt: 1.5,
                }}
              >
                <CountrySelect
                  label="From"
                  value={selectedRoute.source.country}
                  locations={locations}
                  disabledCountry={selectedRoute.target.country}
                  onChange={handleSourceChange}
                />

                <Tooltip title="Swap countries">
                  <IconButton
                    aria-label="Swap origin and destination countries"
                    onClick={() =>
                      selectCountries(
                        selectedRoute.target.country,
                        selectedRoute.source.country,
                      )
                    }
                    sx={{
                      color: '#79DED2',
                      border: '1px solid rgba(121,222,210,0.16)',
                      backgroundColor: 'rgba(121,222,210,0.06)',
                      '&:hover': {
                        backgroundColor: 'rgba(121,222,210,0.12)',
                      },
                    }}
                  >
                    <SwapHorizRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <CountrySelect
                  label="To"
                  value={selectedRoute.target.country}
                  locations={locations}
                  disabledCountry={selectedRoute.source.country}
                  onChange={handleTargetChange}
                />
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 2.25, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="h3" color="inherit">
                  {selectedRoute.source.city}
                </Typography>
                <Typography sx={{ color: '#74DED1' }}>→</Typography>
                <Typography variant="h3" color="inherit">
                  {selectedRoute.target.city}
                </Typography>
              </Stack>
              <Typography sx={{ mt: 0.75, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                {selectedRoute.source.country} to {selectedRoute.target.country}
              </Typography>
            </Box>

            <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.08)' }} />

            <Stack spacing={2.25}>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.42)' }}>
                  Pattern detected
                </Typography>
                <Typography sx={{ mt: 0.45, fontWeight: 650 }}>
                  {selectedRoute.scamType}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 1.25,
                }}
              >
                <Insight label="Risk score" value={`${selectedRoute.riskScore}/100`} icon={<ShieldOutlinedIcon />} />
                <Insight label="Demo reports" value={selectedRoute.reports.toLocaleString('en-GB')} icon={<RouteRoundedIcon />} />
                <Insight label="Exposure" value={selectedRoute.exposure} icon={<TrendingUpRoundedIcon />} />
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2.25,
                    backgroundColor: 'rgba(255,255,255,0.045)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.42)' }}>
                    Classification
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.5,
                      color: riskColors[selectedRoute.riskLevel],
                      fontSize: 13,
                      fontWeight: 750,
                    }}
                  >
                    {selectedRoute.riskLevel} RISK
                  </Typography>
                </Box>
              </Box>

              <Typography sx={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, lineHeight: 1.7 }}>
                {selectedRoute.summary}
              </Typography>
            </Stack>

          </Stack>
        </Box>
      </Box>
    </Card>
  )
}

interface CountrySelectProps {
  label: string
  value: string
  locations: GlobeLocation[]
  disabledCountry: string
  onChange: (country: string) => void
}

function CountrySelect({
  label,
  value,
  locations,
  disabledCountry,
  onChange,
}: CountrySelectProps) {
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      sx={{
        minWidth: 0,
        '& .MuiInputLabel-root': {
          color: 'rgba(255,255,255,0.48)',
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: '#79DED2',
        },
        '& .MuiOutlinedInput-root': {
          color: '#FFFFFF',
          backgroundColor: 'rgba(255,255,255,0.045)',
          '& fieldset': {
            borderColor: 'rgba(255,255,255,0.12)',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(121,222,210,0.32)',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#49BFAF',
          },
        },
        '& .MuiSelect-icon': {
          color: 'rgba(255,255,255,0.5)',
        },
      }}
    >
      {locations.map((location) => (
        <MenuItem
          key={location.country}
          value={location.country}
          disabled={location.country === disabledCountry}
        >
          {location.country}
        </MenuItem>
      ))}
    </TextField>
  )
}

interface InsightProps {
  label: string
  value: string
  icon: ReactNode
}

function Insight({ label, value, icon }: InsightProps) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2.25,
        backgroundColor: 'rgba(255,255,255,0.045)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: '#71DCCE' }}>
        <Box sx={{ display: 'grid', placeItems: 'center', '& svg': { fontSize: 16 } }}>
          {icon}
        </Box>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.42)' }}>
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ mt: 0.75, fontSize: 15, fontWeight: 700 }}>{value}</Typography>
    </Box>
  )
}

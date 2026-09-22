import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'

import { PageHeader } from '../components/common/PageHeader'
import { RiskLevelChip } from '../components/common/RiskLevelChip'
import { analyzeUrl } from '../services/urlAnalysisService'
import type { UrlAnalysisResult } from '../types'

const analysisPanelSx = {
  overflow: 'hidden',
  color: '#0B1F3A',
  border: '1px solid #E2E8F0',
  backgroundColor: '#FFFFFF',
  boxShadow: '0 12px 30px rgba(15, 35, 65, 0.08)',
}

const urlFieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#FFFFFF',
    borderRadius: 2,

    '& fieldset': {
      borderColor: '#CBD5E1',
    },

    '&:hover fieldset': {
      borderColor: '#94A3B8',
    },

    '&.Mui-focused fieldset': {
      borderColor: '#0B817A',
    },
  },

  '& .MuiInputBase-input': {
    color: '#111827',
  },

  '& .MuiInputLabel-root': {
    color: '#111827',
  },

  '& .MuiInputLabel-root.MuiInputLabel-shrink': {
    color: '#111827',
    backgroundColor: '#FFFFFF',
    padding: '0 5px',
    borderRadius: 1,
  },

  '& .MuiInputLabel-root.Mui-focused': {
    color: '#111827',
  },
}

function formatClassification(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getClassificationStyle(classification: string) {
  if (classification === 'POTENTIAL_PHISHING') {
    return {
      color: '#B42318',
      backgroundColor: '#FEE4E2',
      icon: <BlockRoundedIcon fontSize="small" />,
    }
  }

  if (classification === 'SUSPICIOUS') {
    return {
      color: '#A15C00',
      backgroundColor: '#FFF4D6',
      icon: <WarningAmberRoundedIcon fontSize="small" />,
    }
  }

  return {
    color: '#16794B',
    backgroundColor: '#EAF8F0',
    icon: <CheckCircleRoundedIcon fontSize="small" />,
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'The URL could not be analyzed. Please try again.'
}

function UrlResultCard({
  result,
}: {
  result: UrlAnalysisResult | null
}) {
  if (!result) {
    return (
      <Card
        sx={{
          ...analysisPanelSx,
          height: '100%',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack
            spacing={2.5}
            sx={{ minHeight: 390, 
                textAlign: 'center', 
                alignItems: 'center',
                justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: 68,
                height: 68,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                color: '#0B817A',
                backgroundColor: '#E8F8F5',
                border: '1px solid #B7E7DF',
              }}
            >
              <SecurityRoundedIcon sx={{ fontSize: 36 }} />
            </Box>

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 750, color: '#0B1F3A' }}>
                Ready to analyze
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  maxWidth: 350,
                  color: '#5D6B82',
                }}
              >
                Submit a URL to receive a risk score and an explainable decision.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  const classificationStyle = getClassificationStyle(result.classification)

  return (
    <Card sx={{ ...analysisPanelSx, height: '100%' }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2.5}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 750 }}>
                Analysis result
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 0.5,
                  color: '#5D6B82',
                  wordBreak: 'break-word',
                }}
              >
                {result.url}
              </Typography>
            </Box>

            <Chip
              icon={classificationStyle.icon}
              label={formatClassification(result.classification)}
              sx={{
                flexShrink: 0,
                color: classificationStyle.color,
                backgroundColor: classificationStyle.backgroundColor,
                fontWeight: 700,
                '& .MuiChip-icon': {
                  color: 'inherit',
                },
              }}
            />
          </Box>

          <Divider sx={{ borderColor: '#E2E8F0' }} />

          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: '#5D6B82' }}
              >
                Risk score
              </Typography>

              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0B1F3A' }}>
                {result.riskScore}
                <Typography
                  component="span"
                  sx={{
                    ml: 0.5,
                    color: '#5D6B82',
                    fontSize: 16,
                  }}
                >
                  /100
                </Typography>
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={Math.min(Math.max(result.riskScore, 0), 100)}
              color={
                result.riskLevel === 'HIGH'
                  ? 'error'
                  : result.riskLevel === 'MEDIUM'
                    ? 'warning'
                    : 'success'
              }
              sx={{
                height: 9,
                borderRadius: 10,
                backgroundColor: '#EEF1F5',
              }}
            />

            <Box sx={{ mt: 1.25 }}>
              <RiskLevelChip level={result.riskLevel} />
            </Box>
          </Box>

          <Alert
            severity={
              result.classification === 'POTENTIAL_PHISHING'
                ? 'error'
                : result.classification === 'SUSPICIOUS'
                  ? 'warning'
                  : 'success'
            }
            icon={false}
            sx={{
              borderRadius: 2.5,
              backgroundColor: '#F7FAFC',
              border: '1px solid #E2E8F0',
              color: '#0B1F3A',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B1F3A' }}>
              Recommended action
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5, color: '#5D6B82' }}>
              {formatClassification(result.recommendedAction)}
            </Typography>
          </Alert>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 750, color: '#0B1F3A' }}>
              Why this result?
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.75,
                color: '#5D6B82',
              }}
            >
              {result.explanation}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 750, mb: 1.25, color: '#0B1F3A' }}>
              Detected signals
            </Typography>

            {result.triggeredRules.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ color: '#5D6B82' }}
              >
                No significant risk signals were detected.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {result.triggeredRules.map((rule, index) => (
                  <Box
                    key={`${rule.ruleName}-${index}`}
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      backgroundColor: '#F7FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 650, color: '#0B1F3A' }}>
                      {rule.reason}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{ color: '#5D6B82' }}
                    >
                      Risk contribution: +{rule.points} points
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function UrlAnalysisPage() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<UrlAnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedUrl = url.trim()

    if (!trimmedUrl) {
      setError('Please enter a URL.')
      return
    }

    let parsedUrl: URL

    try {
      parsedUrl = new URL(trimmedUrl)
    } catch {
      setError('Please enter a valid URL.')
      return
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      setError('Only HTTP and HTTPS URLs are supported.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const analysisResult = await analyzeUrl({
        url: trimmedUrl,
      })

      setResult(analysisResult)
    } catch (analysisError) {
      setError(getErrorMessage(analysisError))
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setUrl('')
    setResult(null)
    setError('')
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 1240, mx: 'auto', width: '100%' }}>
      <PageHeader
        title="Analyze a URL"
        description="Check a web address for phishing and scam indicators before opening it."
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(0, 0.9fr) minmax(420px, 1.1fr)',
          },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        <Card sx={analysisPanelSx}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack
              spacing={2.5}
              component="form"
              onSubmit={handleSubmit}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 750, color: '#0B1F3A' }}>
                  URL details
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.5,
                    color: '#5D6B82',
                  }}
                >
                  Paste the URL without opening it. SafeFlow will analyze its structure and risk signals.
                </Typography>
              </Box>

              <TextField
                label="URL"
                placeholder="https://example.com/account/verify"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value)
                  setError('')
                }}
                fullWidth
                size="small"
                error={Boolean(error)}
                sx={urlFieldSx}
              />

              {error && <Alert severity="error">{error}</Alert>}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 1.5,
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleClear}
                  disabled={loading}
                  sx={{
                    color: '#0B817A',
                    borderColor: '#8AD6CD',
                    '&:hover': {
                      borderColor: '#0B817A',
                      backgroundColor: '#E8F8F5',
                    },
                  }}
                >
                  Clear
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !url.trim()}
                  startIcon={
                    loading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SearchRoundedIcon />
                    )
                  }
                  sx={{
                    color: '#FFFFFF',
                    backgroundColor: '#0B978C',
                    '&:hover': {
                      backgroundColor: '#087A72',
                    },
                    '&.Mui-disabled': {
                      color: '#94A3B8',
                      backgroundColor: '#E2E8F0',
                    },
                  }}
                >
                  {loading ? 'Analyzing...' : 'Analyze URL'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <UrlResultCard result={result} />
      </Box>
    </Stack>
  )
}

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
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import MarkEmailUnreadRoundedIcon from '@mui/icons-material/MarkEmailUnreadRounded'
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'

import { PageHeader } from '../components/common/PageHeader'
import { RiskLevelChip } from '../components/common/RiskLevelChip'
import { analyzeMessage } from '../services/messageAnalysisService'
import type {
  MessageAnalysisInput,
  MessageAnalysisResult,
  MessageType,
} from '../types'

const emptyForm: MessageAnalysisInput = {
  messageType: 'email',
  sender: '',
  receiver: '',
  subject: '',
  body: '',
}

const analysisPanelSx = {
  overflow: 'hidden',
  color: '#FFFFFF',
  border: '1px solid rgba(78, 228, 213, 0.24)',
  background:
    'radial-gradient(circle at 85% 10%, rgba(87, 225, 208, 0.26), transparent 32%), linear-gradient(135deg, #092638 0%, #0D5260 62%, #10988E 135%)',
  boxShadow: '0 18px 42px rgba(8, 42, 58, 0.18)',
}

const messageFieldSx = {
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

  // labelu cand e deasupra chenarului
  '& .MuiInputLabel-root.MuiInputLabel-shrink': {
    color: '#111827',
    backgroundColor: '#FFFFFF',
    padding: '0 5px',
    borderRadius: 1,
  },

  // labelul cand e in chenar
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#111827',
  },

  '& .MuiInputBase-input::placeholder': {
    color: '#64748B',
    opacity: 1,
  },
}

type MessageField = 'sender' | 'receiver' | 'subject' | 'body'

type FieldErrors = Partial<Record<MessageField, string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const phonePattern = /^\+?[0-9\s().-]{7,20}$/


function validateMessage(input: MessageAnalysisInput): FieldErrors {
  const errors: FieldErrors = {}

  const sender = input.sender.trim()
  const receiver = input.receiver.trim()
  const subject = input.subject.trim()
  const body = input.body.trim()

  if (!body) {
    errors.body = 'Message content is required.'
  } else if (body.length < 3) {
    errors.body = 'Message content must contain at least 3 characters.'
  }

  if (input.messageType === 'email') {
    if (sender && !emailPattern.test(sender)) {
      errors.sender = 'Enter a valid sender email address.'
    }

    if (receiver && !emailPattern.test(receiver)) {
      errors.receiver = 'Enter a valid receiver email address.'
    }

    if (subject.length > 500) {
      errors.subject = 'Subject cannot exceed 500 characters.'
    }
  }

  if (input.messageType === 'sms') {
    if (sender && !phonePattern.test(sender)) {
      errors.sender = 'Enter a valid sender phone number.'
    }

    if (receiver && !phonePattern.test(receiver)) {
      errors.receiver = 'Enter a valid receiver phone number.'
    }
  }

  return errors
}

function formatClassification(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getClassificationColor(classification: string) {
  switch (classification) {
    case 'POTENTIAL_PHISHING':
      return {
        color: '#B42318',
        backgroundColor: '#FEE4E2',
      }

    case 'SUSPICIOUS':
      return {
        color: '#A15C00',
        backgroundColor: '#FFF4D6',
      }

    case 'SPAM':
      return {
        color: '#8B5E00',
        backgroundColor: '#FFF7E0',
      }

    default:
      return {
        color: '#16794B',
        backgroundColor: '#EAF8F0',
      }
  }
}

function getClassificationIcon(classification: string) {
  if (classification === 'POTENTIAL_PHISHING') {
    return <BlockRoundedIcon fontSize="small" />
  }

  if (classification === 'SUSPICIOUS' || classification === 'SPAM') {
    return <WarningAmberRoundedIcon fontSize="small" />
  }

  return <CheckCircleRoundedIcon fontSize="small" />
}

function getErrorMessage(error: unknown) 
{
  const errorMessage = error instanceof Error ? error.message : ''

  let status: number | undefined

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const possibleStatus = (error as { status?: unknown }).status

    if (typeof possibleStatus === 'number') {
      status = possibleStatus
    }
  }

  const normalizedMessage = `${status ?? ''} ${errorMessage}`.toLowerCase()

  if (status === 401 || normalizedMessage.includes('401') || normalizedMessage.includes('unauthorized')) {
    return 'Your session has expired. Please log in again.'
  }

  if (status === 422 || normalizedMessage.includes('422') || normalizedMessage.includes('validation')) {
    return 'Some message fields are invalid. Please review the highlighted fields.'
  }

  if (
    status === 500 ||
    normalizedMessage.includes('500') ||
    normalizedMessage.includes('internal server error')
  ) {
    return 'The analysis service encountered an error. Please try again later.'
  }

  if (
    normalizedMessage.includes('network') ||
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('connection')
  ) {
    return 'The backend is unavailable. Please make sure the API server is running.'
  }

  return errorMessage || 'The message could not be analyzed. Please try again.'
}

function AnalysisResultCard({
  result,
}: {
  result: MessageAnalysisResult | null
}) {
  if (!result) {
  return (
    <Card
      sx={{
        ...analysisPanelSx,
        height: '100%',
        background:
          'radial-gradient(circle at 18% 20%, rgba(87, 225, 208, 0.2), transparent 30%), linear-gradient(145deg, #0B2D42 0%, #123E4A 58%, #167B78 150%)',
      }}
    >
        <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack
            spacing={2.25}
            sx={{
              minHeight: 365,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                color: '#74F1E1',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
              }}
            >
              <SecurityRoundedIcon sx={{ fontSize: 34 }} />
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 750, color: '#FFFFFF' }}>
                Ready to analyze
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  maxWidth: 330,
                  color: 'rgba(255, 255, 255, 0.76)',
                }}
              >
                Submit an email or SMS to receive a risk score and an explainable decision.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  const classificationStyle = getClassificationColor(result.classification)

  return (
    <Card
      sx={{
        ...analysisPanelSx,
        height: '100%',
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2.5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 750 , color: '#FFFFFF' }}>
                Analysis result
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, color: 'rgba(255, 255, 255, 0.75)' }}>
                {result.messageType === 'email' ? 'Email message' : 'SMS message'}
              </Typography>
            </Box>

            <Chip
              icon={getClassificationIcon(result.classification)}
              label={formatClassification(result.classification)}
              sx={{
                color: classificationStyle.color,
                backgroundColor: classificationStyle.backgroundColor,
                fontWeight: 700,
                '& .MuiChip-icon': {
                  color: 'inherit',
                },
              }}
            />
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.22)' }} />

          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                Risk score
              </Typography>

              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {result.riskScore}
                <Typography component="span" color="text.secondary" sx={{ fontSize: 16 }}>
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
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
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
                : result.classification === 'SUSPICIOUS' || result.classification === 'SPAM'
                  ? 'warning'
                  : 'success'
            }
            icon={false}
           sx={{
            borderRadius: 2.5,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            color: '#FFFFFF',
            '& .MuiAlert-icon': {
              color: '#74F1E1',
            },
          }}
          >
            <Typography variant="body2" sx={{ fontWeight: 650, color: '#FFFFFF' }}>
              Recommended action
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5, color: 'rgba(255, 255, 255, 0.82)' }}>
              {formatClassification(result.recommendedAction)}
            </Typography>
          </Alert>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 750, color: '#FFFFFF' }}>
              Why this result?
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, color: 'rgba(255, 255, 255, 0.78)' }}>
              {result.explanation}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 750, mb: 1.25, color: '#FFFFFF' }}>
              Detected signals
            </Typography>

            {result.triggeredRules.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No additional risk signals were detected.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {result.triggeredRules.map((rule) => (
                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 650, color: '#FFFFFF' }}
                    >
                      {rule.reason}
                    </Typography>

                    {rule.points > 0 && (
                      <Typography
                        variant="caption"
                        sx={{ color: 'rgba(255, 255, 255, 0.68)' }}
                      >
                        Risk contribution: +{rule.points} points
                      </Typography>
                    )}
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

export function MessageAnalysisPage() {
  const [messageType, setMessageType] = useState<MessageType>('email')
  const [form, setForm] = useState<MessageAnalysisInput>(emptyForm)
  const [result, setResult] = useState<MessageAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const updateField = (field: MessageField, value: string) => {
  setForm((current) => ({
    ...current,
    [field]: value,
  }))

  setFieldErrors((current) => {
    const nextErrors = { ...current }
    delete nextErrors[field]
    return nextErrors
  })

  setError('')
}

  const handleMessageTypeChange = (
    _event: React.SyntheticEvent,
    value: MessageType,
  ) => {
    setMessageType(value)

    setForm((current) => ({
      ...current,
      messageType: value,
      subject: value === 'email' ? current.subject : '',
    }))

    setFieldErrors({})
    setError('')
    setResult(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => 
    {
      event.preventDefault()

      setError('')

      const input: MessageAnalysisInput = {
        ...form,
        messageType,
      }

      const validationErrors = validateMessage(input)

      setFieldErrors(validationErrors)

      if (Object.keys(validationErrors).length > 0) {
        setError('Please correct the highlighted fields before analyzing the message.')
        return
      }

      setLoading(true)
      setResult(null)

      try {
        const analysisResult = await analyzeMessage(input)
        setResult(analysisResult)
      } catch (analysisError) {
        setError(getErrorMessage(analysisError))
      } finally {
        setLoading(false)
      }
    }

  const handleClear = () => {
    setForm({
      ...emptyForm,
      messageType,
    })
    setFieldErrors({})
    setResult(null)
    setError('')
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 1240, mx: 'auto', width: '100%' }}>
      <PageHeader
        title="Analyze a message"
        description="Check SMS and email content before it reaches the customer."
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.05fr) minmax(380px, 0.95fr)' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        <Card sx={analysisPanelSx}>
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Stack spacing={2.5} component="form" onSubmit={handleSubmit}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 750, color: '#FFFFFF' }}>
                  Message details
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mt: 0.5, color: 'rgba(255, 255, 255, 0.76)' }}
                >
                  Enter the message context and content to receive an explainable risk decision.
                </Typography>
              </Box>

              <Tabs
                value={messageType}
                onChange={handleMessageTypeChange}
                variant="fullWidth"
                sx={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.22)',
                  '& .MuiTab-root': {
                    minHeight: 44,
                    color: 'rgba(255, 255, 255, 0.68)',
                    fontWeight: 700,
                  },
                  '& .Mui-selected': {
                    color: '#FFFFFF !important',
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#62E6D7',
                    height: 3,
                  },
                }}
              >
                <Tab
                  value="email"
                  label="Email"
                  icon={<MarkEmailUnreadRoundedIcon />}
                  iconPosition="start"
                />
                <Tab
                  value="sms"
                  label="SMS"
                  icon={<PhoneIphoneRoundedIcon />}
                  iconPosition="start"
                />
              </Tabs>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 2,
                }}
              >
                <TextField
                  label={messageType === 'email' ? 'Sender email' : 'Sender phone number'}
                  placeholder={
                    messageType === 'email'
                      ? 'security@example.com'
                      : '+40 700 000 000'
                  }
                  value={form.sender}
                  onChange={(event) => updateField('sender', event.target.value)}
                  fullWidth
                  size="small"
                  error={Boolean(fieldErrors.sender)}
                  helperText={fieldErrors.sender}
                  sx={messageFieldSx}
                />

                <TextField
                  label={messageType === 'email' ? 'Receiver email' : 'Receiver phone number'}
                  placeholder={messageType === 'email' ? 'customer@example.com' : '+40 711 111 111'}
                  value={form.receiver}
                  onChange={(event) => updateField('receiver', event.target.value)}
                  fullWidth
                  size="small"
                  error={Boolean(fieldErrors.receiver)}
                  helperText={fieldErrors.receiver}
                  sx={messageFieldSx}
                />
              </Box>

              {messageType === 'email' && (
                <TextField
                  label="Subject"
                  placeholder="Your account requires verification"
                  value={form.subject}
                  onChange={(event) => updateField('subject', event.target.value)}
                  fullWidth
                  error={Boolean(fieldErrors.subject)}
                  helperText={fieldErrors.subject}
                  sx={messageFieldSx}
                  
                />
              )}

              <TextField
                label={messageType === 'email' ? 'Email content' : 'SMS content'}
                placeholder={
                  messageType === 'email'
                    ? 'Paste the email content here...'
                    : 'Paste the SMS content here...'
                }
                value={form.body}
                onChange={(event) => updateField('body', event.target.value)}
                multiline
                minRows={messageType === 'email' ? 7 : 5}
                fullWidth
                required
                sx={messageFieldSx}
              />

              {error && <Alert severity="error">{error}</Alert>}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 1.5,
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleClear}
                  disabled={loading}
                  sx={{
                    color: '#FFFFFF',
                    borderColor: 'rgba(255, 255, 255, 0.62)',
                    '&:hover': {
                      borderColor: '#FFFFFF',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Clear
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    loading ? <CircularProgress size={18} color="inherit" /> : <SearchRoundedIcon />
                  }
                  disabled={loading || !form.body.trim()}
                  sx={{
                    color: '#075B5A',
                    backgroundColor: '#FFFFFF',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: '#E8FFFB',
                      boxShadow: 'none',
                    },
                    '&.Mui-disabled': {
                      color: 'rgba(7, 91, 90, 0.45)',
                      backgroundColor: 'rgba(255, 255, 255, 0.55)',
                    },
                  }}
                >
                  {loading ? 'Analyzing...' : 'Analyze message'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <AnalysisResultCard result={result} />
      </Box>
    </Stack>
  )
}

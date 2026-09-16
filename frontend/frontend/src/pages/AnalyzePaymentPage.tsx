import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import { Link as RouterLink } from 'react-router'
import { PageHeader } from '../components/common/PageHeader'
import { RiskLevelChip } from '../components/common/RiskLevelChip'
import { analyzePayment } from '../services/riskService'

import { useTransactions } from '../context/TransactionContext'
import { createTransactionFromAnalysis } from '../services/transactionMapper'

import type {
  RecommendedAction,
  RiskAnalysisResult,
  RiskLevel,
} from '../types'

interface PaymentFormState {
  amount: string
  currency: string
  date: string
  beneficiary: string
  country: string
  paymentChannel: string
  description: string
}

const initialForm: PaymentFormState = {
  amount: '14500',
  currency: 'USD',
  date: new Date().toISOString().slice(0, 10),
  beneficiary: 'Maxwell Okonkwo',
  country: 'United Kingdom',
  paymentChannel: 'Bank Transfer (SWIFT)',
  description: 'Guaranteed 40% return investment — send now',
}

type PaymentFormErrors = Partial<
  Record<keyof PaymentFormState, string>
>

function validatePaymentForm(form: PaymentFormState): PaymentFormErrors {
  const errors: PaymentFormErrors = {}
  const amount = Number(form.amount)

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Enter an amount greater than 0.'
  }

  if (!form.date) {
    errors.date = 'Select the payment date.'
  }

  if (form.beneficiary.trim().length < 2) {
    errors.beneficiary = 'Enter the beneficiary name.'
  }

  if (form.country.trim().length < 2) {
    errors.country = 'Enter the destination country.'
  }

  return errors
}

const actionConfig: Record<
  RecommendedAction,
  {
    title: string
    description: string
    backgroundColor: string
    borderColor: string
    color: string
  }
> = {
  BLOCK: {
    title: 'Block transaction',
    description:
      'Block this payment and contact the account holder to verify the intent before releasing funds.',
    backgroundColor: '#FFF1F1',
    borderColor: '#F2B8B8',
    color: '#B42318',
  },
  REVIEW: {
    title: 'Flag for review',
    description:
      'Pause the payment and request additional confirmation from the customer or an analyst.',
    backgroundColor: '#FFF8E8',
    borderColor: '#F3D28B',
    color: '#9A5B00',
  },
  ALLOW: {
    title: 'Allow transaction',
    description:
      'The payment can continue through the standard authorization process.',
    backgroundColor: '#ECFDF3',
    borderColor: '#A6E5BE',
    color: '#16794B',
  },
}

function getScoreColor(level: RiskLevel) {
  if (level === 'HIGH') {
    return '#D14343'
  }

  if (level === 'MEDIUM') {
    return '#C76A12'
  }

  return '#14804A'
}

interface RiskScoreRingProps {
  score: number
  level: RiskLevel
}

function RiskScoreRing({ score, level }: RiskScoreRingProps) {
  const scoreColor = getScoreColor(level)

  return (
    <Box
      sx={{
        position: 'relative',
        width: 138,
        height: 138,
        display: 'grid',
        placeItems: 'center',
        mx: 'auto',
      }}
    >
      <CircularProgress
        variant="determinate"
        value={100}
        size={138}
        thickness={4}
        sx={{
          position: 'absolute',
          color: '#EEF1F5',
        }}
      />

      <CircularProgress
        variant="determinate"
        value={score}
        size={138}
        thickness={4}
        sx={{
          position: 'absolute',
          color: scoreColor,
          transform: 'rotate(-90deg)',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
      />

      <Box sx={{ textAlign: 'center' }}>
        <Typography
          sx={{
            color: scoreColor,
            fontSize: 32,
            lineHeight: 1,
            fontWeight: 750,
          }}
        >
          {score}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          / 100
        </Typography>
      </Box>
    </Box>
  )
}

export function AnalyzePaymentPage() {
  const [form, setForm] = useState<PaymentFormState>(initialForm)
  const [result, setResult] = useState<RiskAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<PaymentFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { saveTransaction } = useTransactions()

  const updateForm = <Key extends keyof PaymentFormState>(
    field: Key,
    value: PaymentFormState[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setResult(null)
    setDecisionFeedback(null)

    setSubmitError(null)

    setFormErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })

  }

 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault()

  const errors = validatePaymentForm(form)
  setFormErrors(errors)

  if (Object.keys(errors).length > 0) {
    return
  }

  setLoading(true)
  setResult(null)
  setDecisionFeedback(null)
  setSubmitError(null)

  try {
    const payment = {
      amount: Number(form.amount),
      currency: form.currency,
      date: form.date,
      beneficiary: form.beneficiary,
      country: form.country,
      paymentChannel: form.paymentChannel,
      description: form.description,
    }

    const analysis = await analyzePayment(payment)

    const transaction = createTransactionFromAnalysis(
      payment,
      analysis,
    )

    await saveTransaction(transaction)

    setResult(analysis)

  } catch (error) {
    setSubmitError(
      error instanceof Error
        ? error.message
        : 'The risk analysis could not be completed. Please try again.',
    )
  } finally {
    setLoading(false)
  }
}

  const handleDecision = (decision: string) => {
    setDecisionFeedback(`Demo decision recorded: ${decision}.`)
  }

  const handleReset = () => {
    setForm({ ...initialForm })
    setResult(null)
    setFormErrors({})
    setSubmitError(null)
    setDecisionFeedback(null)
  }

  const factors = result
    ? [...result.triggeredRules, ...result.descriptionSignals]
    : []

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Transaction Risk Check"
        description="Review payment details and receive an explainable risk assessment before releasing funds."
        action={
          <Button
            component={RouterLink}
            to="/transactions"
            startIcon={<ArrowBackRoundedIcon />}
          >
            Back to transactions
          </Button>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(0, 1.35fr) minmax(330px, 0.65fr)',
          },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Card component="form" onSubmit={handleSubmit}>
          <CardContent
            sx={{
              p: { xs: 2.5, md: 3 },
              '&:last-child': { pb: { xs: 2.5, md: 3 } },
            }}
          >
            <Typography variant="h3">Transaction details</Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Enter the payment context. Risk features are evaluated automatically in the background.
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 2,
                mt: 3,
              }}
            >
              <TextField
                required
                label="Amount"
                type="number"
                value={form.amount}
                onChange={(event) => updateForm('amount', event.target.value)}
                error={Boolean(formErrors.amount)}
                helperText={formErrors.amount}
                slotProps={{
                htmlInput: { min: 0.01, step: '0.01' },
              }}
              />

              <TextField
                required
                select
                label="Currency"
                value={form.currency}
                onChange={(event) => updateForm('currency', event.target.value)}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="RON">RON</MenuItem>
              </TextField>

              <TextField
                required
                label="Payment date"
                type="date"
                value={form.date}
                onChange={(event) => updateForm('date', event.target.value)}
                error={Boolean(formErrors.date)}
                helperText={formErrors.date}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <TextField
                required
                label="Beneficiary"
                value={form.beneficiary}
                onChange={(event) => updateForm('beneficiary', event.target.value)}
                error={Boolean(formErrors.beneficiary)}
                helperText={formErrors.beneficiary}
              />

              <TextField
                required
                label="Destination country"
                value={form.country}
                onChange={(event) => updateForm('country', event.target.value)}
                error={Boolean(formErrors.country)}
                helperText={formErrors.country}
              />

              <TextField
                required
                select
                label="Payment method"
                value={form.paymentChannel}
                onChange={(event) =>
                  updateForm('paymentChannel', event.target.value)
                }
              >
                <MenuItem value="Bank Transfer (SWIFT)">
                  Bank Transfer (SWIFT)
                </MenuItem>
                <MenuItem value="Online banking">Online banking</MenuItem>
                <MenuItem value="Mobile banking">Mobile banking</MenuItem>
                <MenuItem value="Wire transfer">Wire transfer</MenuItem>
                <MenuItem value="Cryptocurrency">Cryptocurrency</MenuItem>
              </TextField>

              <TextField
                label="Description / reference"
                value={form.description}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
                multiline
                minRows={4}
                fullWidth
                placeholder="What is this payment for?"
                sx={{
                  gridColumn: { xs: 'auto', md: '1 / -1' },
                }}
              />
            </Box>

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ mt: 3 }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SecurityRoundedIcon />
                    )
                  }
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {loading ? 'Analyzing transaction...' : 'Analyze transaction'}
                </Button>

                <Button
                  type="button"
                  variant="outlined"
                  disabled={loading}
                  onClick={handleReset}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Reset form
                </Button>
              </Stack>
          </CardContent>
        </Card>

        <Stack spacing={2}>
          <Card>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Typography variant="h3">Risk assessment</Typography>

                {submitError && (
                  <Alert severity="error" onClose={() => setSubmitError(null)}>
                    {submitError}
                  </Alert>
)}

                {result && <RiskLevelChip level={result.riskLevel} />}
              </Box>

              {!result && !loading && (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      display: 'grid',
                      placeItems: 'center',
                      mx: 'auto',
                      mb: 2,
                      borderRadius: '50%',
                      color: 'primary.main',
                      backgroundColor: '#E8F8F5',
                    }}
                  >
                    <SecurityRoundedIcon fontSize="large" />
                  </Box>

                  <Typography sx={{ fontWeight: 650 }}>
                    Awaiting analysis
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.75 }}
                  >
                    Submit the payment to receive a score and a recommended action.
                  </Typography>
                </Box>
              )}

              {loading && (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <CircularProgress />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2 }}
                  >
                    Evaluating payment context...
                  </Typography>
                </Box>
              )}

              {result && (
                <Box sx={{ pt: 3 }}>
                  <RiskScoreRing
                    score={result.riskScore}
                    level={result.riskLevel}
                  />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 2, textAlign: 'center' }}
                  >
                    Risk score
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {result && (
            <>
              <Card>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Typography
                    variant="overline"
                    sx={{ fontWeight: 750, letterSpacing: '0.08em' }}
                  >
                    Risk factors detected
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, mb: 2 }}
                  >
                    Signals returned by the risk engine.
                  </Typography>

                  {factors.length === 0 ? (
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <CheckCircleRoundedIcon color="success" fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        No risk factors detected.
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={1.25}>
                      {factors.map((factor) => (
                        <Stack
                          key={factor}
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: 'flex-start' }}
                        >
                          <CloseRoundedIcon
                            sx={{
                              mt: 0.15,
                              fontSize: 17,
                              color: result.riskLevel === 'LOW'
                                ? 'success.main'
                                : 'error.main',
                            }}
                          />
                          <Typography variant="body2">
                            {factor}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              <Box
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: actionConfig[result.recommendedAction].borderColor,
                  borderRadius: 3,
                  backgroundColor:
                    actionConfig[result.recommendedAction].backgroundColor,
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: actionConfig[result.recommendedAction].color,
                    fontWeight: 750,
                    letterSpacing: '0.08em',
                  }}
                >
                  Recommended action
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.75,
                    color: actionConfig[result.recommendedAction].color,
                    lineHeight: 1.65,
                  }}
                >
                  {actionConfig[result.recommendedAction].description}
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{ mt: 2 }}
                >
                  {result.recommendedAction === 'BLOCK' && (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleDecision('Block transaction')}
                      sx={{ flex: 1 }}
                    >
                      Block transaction
                    </Button>
                  )}

                  {result.recommendedAction === 'ALLOW' && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleDecision('Allow transaction')}
                      sx={{ flex: 1 }}
                    >
                      Allow transaction
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    onClick={() => handleDecision('Flag for review')}
                    sx={{
                      flex: 1,
                      color: actionConfig[result.recommendedAction].color,
                      borderColor:
                        actionConfig[result.recommendedAction].borderColor,
                    }}
                  >
                    Flag for review
                  </Button>
                </Stack>
              </Box>

              <Alert severity={result.riskLevel === 'HIGH' ? 'error' : result.riskLevel === 'MEDIUM' ? 'warning' : 'success'}>
                {result.explanation}
              </Alert>

              {decisionFeedback && (
                <Alert severity="info">{decisionFeedback}</Alert>
              )}

              <Divider />

              <Typography variant="caption" color="text.secondary">
                The visible result is generated from the payment context. Internal
                risk features remain hidden from the operator.
              </Typography>
            </>
          )}
        </Stack>
      </Box>
    </Stack>
  )
}
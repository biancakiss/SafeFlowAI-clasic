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
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { PageHeader } from '../components/common/PageHeader'
import { RiskLevelChip } from '../components/common/RiskLevelChip'
import { analyzePaymentMock } from '../services/riskService'
import type { RiskAnalysisRequest, RiskAnalysisResult } from '../types'

const initialSignals: RiskAnalysisRequest = {
  is_new_beneficiary: 0,
  is_unusually_large: 0,
  recent_transaction_count: 0,
  is_unusual_country: 0,
  is_risky_payment_channel: 0,
}

export function AnalyzePaymentPage() {
  const [signals, setSignals] = useState<RiskAnalysisRequest>(initialSignals)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RiskAnalysisResult | null>(null)

  const setBinarySignal = (
    key: Exclude<keyof RiskAnalysisRequest, 'recent_transaction_count'>,
    checked: boolean,
  ) => {
    setSignals((current) => ({ ...current, [key]: checked ? 1 : 0 }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setResult(null)

    const analysis = await analyzePaymentMock(signals)
    setResult(analysis)
    setLoading(false)
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Analyze a payment"
        description="Check risk signals before the customer authorizes the transfer."
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.35fr) minmax(320px, 0.65fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Card component="form" onSubmit={handleSubmit}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: { xs: 2.5, md: 3 } } }}>
            <Typography variant="h3">Payment details</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Contextual fields are displayed for the analyst; the risk signals below match the API contract.
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 2,
                mt: 3,
              }}
            >
              <TextField required label="Amount" type="number" defaultValue="12500" />
              <TextField select required label="Currency" defaultValue="EUR">
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="RON">RON</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
              <TextField required label="Beneficiary" defaultValue="Apex Trading Group" />
              <TextField required label="Destination country" defaultValue="United Kingdom" />
              <TextField select required label="Payment channel" defaultValue="Mobile banking">
                <MenuItem value="Mobile banking">Mobile banking</MenuItem>
                <MenuItem value="Online banking">Online banking</MenuItem>
                <MenuItem value="API transfer">API transfer</MenuItem>
              </TextField>
              <TextField
                required
                label="Recent transaction count"
                type="number"
                value={signals.recent_transaction_count}
                onChange={(event) =>
                  setSignals((current) => ({
                    ...current,
                    recent_transaction_count: Math.max(0, Number(event.target.value)),
                  }))
                }
              />
            </Box>

            <Divider sx={{ my: 3 }} />
            <Typography variant="h3">Detected risk signals</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              These controls simulate features produced by the ETL and machine-learning pipeline.
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 1,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={signals.is_new_beneficiary === 1}
                    onChange={(event) => setBinarySignal('is_new_beneficiary', event.target.checked)}
                  />
                }
                label="New beneficiary"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={signals.is_unusually_large === 1}
                    onChange={(event) => setBinarySignal('is_unusually_large', event.target.checked)}
                  />
                }
                label="Unusually large amount"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={signals.is_unusual_country === 1}
                    onChange={(event) => setBinarySignal('is_unusual_country', event.target.checked)}
                  />
                }
                label="Unusual destination country"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={signals.is_risky_payment_channel === 1}
                    onChange={(event) =>
                      setBinarySignal('is_risky_payment_channel', event.target.checked)
                    }
                  />
                }
                label="Risky payment channel"
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SecurityRoundedIcon />}
              sx={{ mt: 3 }}
            >
              {loading ? 'Analyzing payment...' : 'Run risk analysis'}
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ position: { xl: 'sticky' }, top: { xl: 92 } }}>
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Typography variant="h3">Analysis result</Typography>
            {!result && !loading && (
              <Box sx={{ py: 7, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    display: 'grid',
                    placeItems: 'center',
                    mx: 'auto',
                    mb: 2,
                    borderRadius: 3,
                    color: 'primary.main',
                    backgroundColor: '#E8F8F5',
                  }}
                >
                  <SecurityRoundedIcon fontSize="large" />
                </Box>
                <Typography sx={{ fontWeight: 650 }}>Ready to analyze</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  Submit the payment to receive a score and an explainable risk decision.
                </Typography>
              </Box>
            )}

            {loading && (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Evaluating transaction signals...
                </Typography>
              </Box>
            )}

            {result && (
              <Stack spacing={2.5} sx={{ mt: 2.5 }}>
                <Box
                  sx={{
                    p: 2.5,
                    textAlign: 'center',
                    borderRadius: 3,
                    backgroundColor: '#F7F9FC',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Risk score
                  </Typography>
                  <Typography sx={{ my: 0.5, fontSize: 42, lineHeight: 1.1, fontWeight: 750 }}>
                    {result.riskScore}
                    <Typography component="span" color="text.secondary" sx={{ fontWeight: 500 }}>
                      /100
                    </Typography>
                  </Typography>
                  <RiskLevelChip level={result.riskLevel} />
                </Box>

                <Alert
                  severity={result.riskLevel === 'HIGH' ? 'error' : result.riskLevel === 'MEDIUM' ? 'warning' : 'success'}
                >
                  {result.riskLevel === 'HIGH'
                    ? 'Pause this payment and request manual verification.'
                    : result.riskLevel === 'MEDIUM'
                      ? 'Additional customer confirmation is recommended.'
                      : 'No significant risk signals were detected.'}
                </Alert>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 700 }}>
                    Triggered rules
                  </Typography>
                  {result.triggeredRules.length === 0 ? (
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <CheckCircleRoundedIcon color="success" fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        No risk rules triggered
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={1}>
                      {result.triggeredRules.map((rule) => (
                        <Typography key={rule} variant="body2" color="text.secondary">
                          • {rule}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>
    </Stack>
  )
}

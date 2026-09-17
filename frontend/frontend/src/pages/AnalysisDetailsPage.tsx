import { useState, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import {
  ArrowBackRounded,
  BlockOutlined,
  CheckCircleOutlined,
  FlagOutlined,
} from '@mui/icons-material'
import { Link as RouterLink, useParams } from 'react-router'

import { useTransactions } from '../context/TransactionContext'
import type { TransactionStatus } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { RiskLevelChip } from '../components/common/RiskLevelChip'

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function AnalysisDetailsPage() {
  const { analysisId } = useParams<{ analysisId: string }>()

  const {
    transactions,
    loading,
    error,
    updateTransactionStatus,
  } = useTransactions()

  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  const transaction = transactions.find(
    (item) =>
      item.id === analysisId ||
      item.analysisId?.toString() === analysisId,
  )

  const handleStatusChange = async (
    status: TransactionStatus,
    label: string,
  ) => {
    if (!transaction) {
      return
    }

    setActionFeedback(null)

    try {
      const updatedTransaction = await updateTransactionStatus(
        transaction.id,
        status,
      )

      if (updatedTransaction) {
        setActionFeedback(`${label} status saved successfully.`)
      }
    } catch {
      setActionFeedback('The status could not be updated.')
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 360,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <PageHeader
          title="Analysis details"
          description="Review the risk decision and payment context."
        />

        <Alert severity="error">{error}</Alert>

        <Button
          component={RouterLink}
          to="/transactions"
          startIcon={<ArrowBackRounded />}
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to transactions
        </Button>
      </Stack>
    )
  }

  if (!transaction) {
    return (
      <Stack spacing={2}>
        <PageHeader
          title="Analysis not found"
          description="The requested payment analysis is not available."
        />

        <Alert severity="warning">
          This analysis may have been removed or the link is invalid.
        </Alert>

        <Button
          component={RouterLink}
          to="/transactions"
          startIcon={<ArrowBackRounded />}
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to transactions
        </Button>
      </Stack>
    )
  }

  const detectedFactors = [
    ...(transaction.triggeredRules ?? []).map(
      (rule) => `${rule.reason} (+${rule.points})`,
    ),
    ...(transaction.descriptionSignals ?? []),
  ]

  const riskIsHigh = transaction.riskLevel === 'HIGH'

  return (
    <Stack spacing={3}>
      <PageHeader
        title={`Analysis ${transaction.id}`}
        description="Review the payment context, detected signals and recommended action."
        action={
          <Button
            component={RouterLink}
            to="/transactions"
            startIcon={<ArrowBackRounded />}
          >
            Back to transactions
          </Button>
        }
      />

      {actionFeedback && (
        <Alert
          severity={
            actionFeedback.includes('could not')
              ? 'error'
              : 'success'
          }
        >
          {actionFeedback}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '1.15fr 0.85fr',
          },
          gap: 3,
        }}
      >
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.5}>
              <Stack
                direction="row"
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Typography variant="h3">
                  Payment information
                </Typography>

                <Chip
                  label={transaction.status}
                  color={
                    transaction.status === 'Blocked'
                      ? 'error'
                      : transaction.status === 'Approved'
                        ? 'success'
                        : 'warning'
                  }
                  variant="outlined"
                />
              </Stack>

              <Divider />

              <Stack
                divider={<Divider flexItem />}
                spacing={2}
              >
                <InfoItem label="Beneficiary">
                  {transaction.beneficiary}
                </InfoItem>

                <InfoItem label="Destination country">
                  {transaction.country}
                </InfoItem>

                <InfoItem label="Amount">
                  {transaction.currency}{' '}
                  {transaction.amount.toLocaleString('en-GB')}
                </InfoItem>

                <InfoItem label="Payment channel">
                  {transaction.channel}
                </InfoItem>

                <InfoItem label="Created">
                  {formatDate(transaction.createdAt)}
                </InfoItem>

                <InfoItem label="Transaction ID">
                  {transaction.id}
                </InfoItem>

                {transaction.analysisId !== undefined && (
                  <InfoItem label="Backend analysis ID">
                    {transaction.analysisId}
                  </InfoItem>
                )}
              </Stack>

              {transaction.description && (
                <>
                  <Divider />

                  <InfoItem label="Payment description">
                    {transaction.description}
                  </InfoItem>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.5}>
              <Typography variant="h3">
                Risk decision
              </Typography>

              <Divider />

              <Box sx={{ py: 2, textAlign: 'center' }}>
                <Typography
                  sx={{
                    fontSize: 48,
                    lineHeight: 1,
                    fontWeight: 800,
                  }}
                >
                  {transaction.riskScore}
                  <Typography
                    component="span"
                    color="text.secondary"
                    sx={{ fontSize: 20 }}
                  >
                    /100
                  </Typography>
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <RiskLevelChip level={transaction.riskLevel} />
                </Box>
              </Box>

              <Stack
                direction="row"
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography color="text.secondary">
                  Recommended action
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                  }}
                >
                  {transaction.recommendedAction ?? 'REVIEW'}
                </Typography>
              </Stack>

              <Alert
                severity={
                  transaction.riskLevel === 'HIGH'
                    ? 'error'
                    : transaction.riskLevel === 'MEDIUM'
                      ? 'warning'
                      : 'success'
                }
              >
                {transaction.explanation ??
                  (riskIsHigh
                    ? 'Verify the beneficiary and request additional confirmation before release.'
                    : 'The payment can continue under the standard authorization process.')}
              </Alert>

              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center' }}
              >
                <CheckCircleOutlined
                  color="success"
                  fontSize="small"
                />

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Explainable decision generated by the SafeFlow
                  risk engine.
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="h3">
              Detected risk factors
            </Typography>

            <Divider />

            {detectedFactors.length === 0 ? (
              <Alert severity="success">
                No significant risk factors were detected.
              </Alert>
            ) : (
              <Stack spacing={1.25}>
                {detectedFactors.map((factor, index) => (
                  <Stack
                    key={`${factor}-${index}`}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'flex-start' }}
                  >
                    <Box
                      component="span"
                      sx={{
                        mt: 0.8,
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        bgcolor: 'error.main',
                        flexShrink: 0,
                      }}
                    />

                    <Typography>{factor}</Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="h3">
              Analyst actions
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Update the operational status after reviewing the payment.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
            >
              <Button
                fullWidth
                variant={
                  transaction.status === 'Approved'
                    ? 'contained'
                    : 'outlined'
                }
                color="success"
                startIcon={<CheckCircleOutlined />}
                onClick={() =>
                  handleStatusChange('Approved', 'Approved')
                }
              >
                Approve payment
              </Button>

              <Button
                fullWidth
                variant={
                  transaction.status === 'In review'
                    ? 'contained'
                    : 'outlined'
                }
                color="warning"
                startIcon={<FlagOutlined />}
                onClick={() =>
                  handleStatusChange('In review', 'In review')
                }
              >
                Flag for review
              </Button>

              <Button
                fullWidth
                variant={
                  transaction.status === 'Blocked'
                    ? 'contained'
                    : 'outlined'
                }
                color="error"
                startIcon={<BlockOutlined />}
                onClick={() =>
                  handleStatusChange('Blocked', 'Blocked')
                }
              >
                Block payment
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

type InfoItemProps = {
  label: string
  children: ReactNode
}

function InfoItem({ label, children }: InfoItemProps) {
  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          fontWeight: 650,
          textAlign: 'right',
        }}
      >
        {children}
      </Typography>
    </Stack>
  )
}

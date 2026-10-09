import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded'
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { LineChart } from '@mui/x-charts/LineChart'
import {
  Link as RouterLink,
  useNavigate,
} from 'react-router'
import { useEffect, useState } from 'react'
import { MetricCard } from '../components/common/MetricCard'
import { PageHeader } from '../components/common/PageHeader'
import { RiskLevelChip } from '../components/common/RiskLevelChip'
import { ScamGlobeSection } from '../components/dashboard/ScamGlobeSection'
import { DemoReviewsSection } from '../components/dashboard/DemoReviewsSection'
import {
  globeLocations,
  riskTrend,
  scamRoutes,
} from '../mocks/dashboardData'

import { useTransactions } from '../context/TransactionContext'
import { useAuth } from '../context/AuthContext'
import { environment } from '../config/environment'
import { ApiError } from '../services/apiClient'
import {
  getDashboardData,
  type DashboardData,
} from '../services/dashboardService'
import type { Transaction } from '../types'

const currency = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0,
})

export function DashboardPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { transactions } = useTransactions()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  useEffect(() => {
    if (environment.useMock) return

    let active = true

    void getDashboardData()
      .then((data) => {
        if (active) setDashboardData(data)
      })
      .catch((error: unknown) => {
        if (!active) return

        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }

        setDashboardError(
          error instanceof Error
            ? error.message
            : 'Dashboard data could not be loaded.',
        )
      })

    return () => {
      active = false
    }
  }, [logout])

  const totalTransactions =
    dashboardData?.summary.paymentsAnalyzed ?? transactions.length

  const lowRiskCount = transactions.filter(
    (transaction) => transaction.riskLevel === 'LOW',
  ).length

  const mediumRiskCount = transactions.filter(
    (transaction) => transaction.riskLevel === 'MEDIUM',
  ).length

  const localHighRiskCount = transactions.filter(
    (transaction) => transaction.riskLevel === 'HIGH',
  ).length

  const highRiskCount =
    dashboardData?.summary.highRiskPayments ?? localHighRiskCount

  const safePaymentRate = dashboardData
    ? dashboardData.summary.safePaymentRate.toFixed(1)
    : totalTransactions > 0
      ? ((lowRiskCount / totalTransactions) * 100).toFixed(1)
      : '0.0'

  const metricCurrencyCode =
    dashboardData?.recentAnalyses[0]?.currency ??
    transactions.find((transaction) => transaction.currency)?.currency ??
    'EUR'

  const blockedAmount = transactions
    .filter(
      (transaction) =>
        transaction.status === 'Blocked' &&
        transaction.currency === metricCurrencyCode,
    )
    .reduce((total, transaction) => total + transaction.amount, 0)

  const preventedLoss = dashboardData?.summary.potentialLossPrevented ?? blockedAmount

  const metricAmountFormatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: metricCurrencyCode,
    maximumFractionDigits: 0,
  })

  const lowRiskPercentage = dashboardData?.riskDistribution.lowRiskPercentage ??
    (totalTransactions > 0
      ? Math.round((lowRiskCount / totalTransactions) * 100)
      : 0)

  const mediumRiskPercentage = dashboardData?.riskDistribution.mediumRiskPercentage ??
    (totalTransactions > 0
      ? Math.round((mediumRiskCount / totalTransactions) * 100)
      : 0)

  const highRiskPercentage = dashboardData?.riskDistribution.highRiskPercentage ??
    (totalTransactions > 0
      ? 100 - lowRiskPercentage - mediumRiskPercentage
      : 0)

  const distribution = [
    {
      label: 'Low risk',
      value: lowRiskPercentage,
      color: '#20A464',
    },
    {
      label: 'Medium risk',
      value: mediumRiskPercentage,
      color: '#E18A2D',
    },
    {
      label: 'High risk',
      value: highRiskPercentage,
      color: '#D95555',
    },
  ]

  const distributionBackground =
    totalTransactions > 0
      ? `conic-gradient(
          #20A464 0 ${lowRiskPercentage}%,
          #E18A2D ${lowRiskPercentage}% ${
            lowRiskPercentage + mediumRiskPercentage
          }%,
          #D95555 ${
            lowRiskPercentage + mediumRiskPercentage
          }% 100%
        )`
      : '#EEF1F5'

  const riskActivity = dashboardData?.riskActivity ?? riskTrend.map((point) => ({
    date: point.day,
    analyzed: point.analyzed,
    highRisk: point.highRisk,
  }))
  // The transaction context is the live source for the table. This is
  // important because it immediately reflects Approved/Blocked decisions.
  // The dashboard endpoint is used as a fallback while transactions load.
  const recentAnalyses = transactions.length > 0
    ? transactions.slice(0, 4).map((transaction) => ({
        transactionId: transaction.id,
        beneficiary: transaction.beneficiary,
        country: transaction.country,
        amount: transaction.amount,
        currency: transaction.currency,
        riskLevel: transaction.riskLevel,
        riskScore: transaction.riskScore,
        status: transaction.status,
        createdAt: transaction.createdAt,
      }))
    : dashboardData?.recentAnalyses ?? []

  const openAnalysis = (transaction: Transaction | { transactionId: string }) => {
    if ('transactionId' in transaction) {
      navigate(`/analyses/${transaction.transactionId}`)
      return
    }

    navigate(`/analyses/${transaction.analysisId?.toString() ?? transaction.id}`)
  }

  const dashboardLoading =
    !environment.useMock && dashboardData === null && dashboardError === null

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Payment risk overview"
        description="Monitor payment activity and intervene before suspicious transfers are completed."
        action={
          <Button
            component={RouterLink}
            to="/analyze"
            variant="contained"
            startIcon={<AddRoundedIcon />}
          >
            Analyze payment
          </Button>
        }
      />

      {dashboardLoading && <LinearProgress />}
      {dashboardError && <Alert severity="error">{dashboardError}</Alert>}

      <ScamGlobeSection routes={scamRoutes} locations={globeLocations} />

      <Card
        sx={{
          overflow: 'hidden',
          color: 'text.primary',
          borderColor: 'rgba(14,147,132,0.18)',
          background:
            'radial-gradient(circle at 82% 18%, rgba(100,226,210,0.16), transparent 25%), linear-gradient(115deg, #FFFFFF, #F1FBF8)',
        }}
      >
        <CardContent
          sx={{
            p: { xs: 2.5, md: 3.25 },
            '&:last-child': { pb: { xs: 2.5, md: 3.25 } },
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                borderRadius: 3,
                color: '#FFFFFF',
                backgroundColor: 'primary.main',
              }}
            >
              <GppGoodRoundedIcon />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h2">
                  Protection is active
                </Typography>
                <Chip
                  size="small"
                  icon={<CheckCircleRoundedIcon />}
                  label="All systems operational"
                  sx={{
                    color: '#087467',
                    backgroundColor: 'rgba(14,147,132,0.1)',
                    '& .MuiChip-icon': { color: '#0E9384' },
                  }}
                />
              </Box>
              <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 620 }}>
                SafeFlow analyzed {totalTransactions.toLocaleString('en-GB')} payments and flagged {highRiskCount.toLocaleString('en-GB')} as high risk.
              </Typography>
            </Box>
          </Box>
          <Button
            component={RouterLink}
            to="/transactions"
            variant="outlined"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              color: 'primary.dark',
              borderColor: 'rgba(14,147,132,0.3)',
              '&:hover': { borderColor: 'primary.main', backgroundColor: 'rgba(14,147,132,0.06)' },
            }}
          >
            View activity
          </Button>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        <MetricCard
          title="Payments analyzed"
          value={totalTransactions.toLocaleString('en-GB')}
          change="Live"
          helper="from transactions"
          icon={<PaymentsRoundedIcon />}
          color="#3156D3"
          backgroundColor="#EDF1FF"
        />
        <MetricCard
          title="High-risk payments"
          value={(dashboardData?.summary.highRiskPayments ?? highRiskCount).toLocaleString('en-GB')}
          change="Live"
          helper="high-risk records"
          icon={<ReportProblemRoundedIcon />}
          color="#C34242"
          backgroundColor="#FDEDED"
        />
        <MetricCard
          title="Potential loss prevented"
          value={metricAmountFormatter.format(preventedLoss)}
          change="Live"
          helper="blocked payment value"
          icon={<SavingsRoundedIcon />}
          color="#14804A"
          backgroundColor="#EAF8F0"
        />
        <MetricCard
          title="Safe payment rate"
          value={`${safePaymentRate}%`}
          change="Live"
          helper="low-risk payment rate"
          icon={<GppGoodRoundedIcon />}
          color="#0E9384"
          backgroundColor="#E8F8F5"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(280px, 0.8fr)' },
          gap: 2,
        }}
      >
        <Card>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
              <Box>
                <Typography variant="h3">Risk activity</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Payments analyzed over the last seven days
                </Typography>
              </Box>
              <Chip size="small" label="Last 7 days" variant="outlined" />
            </Box>
            <LineChart
              height={300}
              xAxis={[{ scaleType: 'point', data: riskActivity.map((point) => point.date) }]}
              series={[
                {
                  data: riskActivity.map((point) => point.analyzed),
                  label: 'Analyzed',
                  color: '#3156D3',
                  area: true,
                  showMark: false,
                },
                {
                  data: riskActivity.map((point) => point.highRisk),
                  label: 'High risk',
                  color: '#D95555',
                  showMark: false,
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ left: 10, right: 20, top: 30, bottom: 20 }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Typography variant="h3">Risk distribution</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
              Current classification of analyzed payments
            </Typography>
            <Box sx={{ display: 'grid', placeItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 148,
                  height: 148,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  background: distributionBackground,
                }}
              >
                <Box
                  sx={{
                    width: 104,
                    height: 104,
                    display: 'grid',
                    placeItems: 'center',
                    textAlign: 'center',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 24, fontWeight: 750 }}>
                    {totalTransactions.toLocaleString('en-GB')}
                  </Typography>
                    <Typography variant="caption" color="text.secondary">
                      total
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Stack spacing={2}>
              {distribution.map((item) => (
                <Box key={item.label}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: 550 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.value}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.value}
                    sx={{
                      height: 6,
                      borderRadius: 4,
                      backgroundColor: '#EEF1F5',
                      '& .MuiLinearProgress-bar': { backgroundColor: item.color, borderRadius: 4 },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box>
              <Typography variant="h3">Recent payment analyses</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Latest decisions from the risk engine
              </Typography>
            </Box>
            <Button component={RouterLink} to="/transactions" endIcon={<ArrowForwardRoundedIcon />}>
              View all
            </Button>
          </Box>
          <TableContainer>
            <Table sx={{ minWidth: 780 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction</TableCell>
                  <TableCell>Beneficiary</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Risk level</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentAnalyses.map((transaction) => (
                  <TableRow
                      key={transaction.transactionId}
                      hover
                      tabIndex={0}
                      onClick={() => openAnalysis(transaction)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openAnalysis(transaction)
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        '&:focus-visible': {
                          outline: '2px solid',
                          outlineColor: 'primary.main',
                          outlineOffset: -2,
                        },
                      }}
                    >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 650 }}>
                        {transaction.transactionId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 550 }}>
                        {transaction.beneficiary}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {transaction.country}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 650 }}>
                        {transaction.currency} {currency.format(transaction.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <RiskLevelChip level={transaction.riskLevel} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
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
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {transaction.createdAt}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <DemoReviewsSection />
    </Stack>
  )
}

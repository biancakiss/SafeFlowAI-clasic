import { ApiError, apiRequest } from './apiClient'
import { getStoredToken } from './authService'
import type {
  DashboardRecentAnalysis,
  DashboardRiskActivityPoint,
  DashboardRiskDistribution,
  DashboardSummary,
  RiskLevel,
  TransactionStatus,
} from '../types'

interface BackendDashboardSummary {
  payments_analyzed: number
  high_risk_payments: number
  potential_loss_prevented: number | string
  safe_payment_rate: number
}

interface BackendRiskActivityItem {
  date: string
  analyzed: number
  high_risk: number
}

interface BackendRiskActivityResponse {
  days: number
  data: BackendRiskActivityItem[]
}

interface BackendRiskDistributionResponse {
  total: number
  low_risk: number
  medium_risk: number
  high_risk: number
  low_risk_percentage: number
  medium_risk_percentage: number
  high_risk_percentage: number
}

interface BackendRecentAnalysis {
  transaction_id: string
  beneficiary_name: string
  beneficiary_country: string
  amount: number | string
  currency: string
  risk_level: string
  risk_score: number
  status: 'approved' | 'in_review' | 'blocked'
  created_at: string
}

export interface DashboardData {
  summary: DashboardSummary
  riskActivity: DashboardRiskActivityPoint[]
  riskDistribution: DashboardRiskDistribution
  recentAnalyses: DashboardRecentAnalysis[]
}

function requireToken(): string {
  const token = getStoredToken()

  if (!token) {
    throw new ApiError('Please sign in before loading the dashboard.', 401)
  }

  return token
}

function mapRiskLevel(value: string): RiskLevel {
  const normalized = value.toUpperCase()

  if (normalized === 'MEDIUM') return 'MEDIUM'
  if (normalized === 'HIGH') return 'HIGH'
  return 'LOW'
}

function mapStatus(
  value: BackendRecentAnalysis['status'],
): TransactionStatus {
  if (value === 'approved') return 'Approved'
  if (value === 'blocked') return 'Blocked'
  return 'In review'
}

export async function getDashboardData(): Promise<DashboardData> {
  const token = requireToken()
  const [summary, activity, distribution, recentAnalyses] = await Promise.all([
    apiRequest<BackendDashboardSummary>('/api/v1/dashboard/summary', { token }),
    apiRequest<BackendRiskActivityResponse>(
      '/api/v1/dashboard/risk-activity?days=7',
      { token },
    ),
    apiRequest<BackendRiskDistributionResponse>(
      '/api/v1/dashboard/risk-distribution',
      { token },
    ),
    apiRequest<BackendRecentAnalysis[]>(
      '/api/v1/dashboard/recent-analyses?limit=4',
      { token },
    ),
  ])

  return {
    summary: {
      paymentsAnalyzed: summary.payments_analyzed,
      highRiskPayments: summary.high_risk_payments,
      potentialLossPrevented: Number(summary.potential_loss_prevented),
      safePaymentRate: summary.safe_payment_rate,
    },
    riskActivity: activity.data.map((point) => ({
      date: point.date,
      analyzed: point.analyzed,
      highRisk: point.high_risk,
    })),
    riskDistribution: {
      total: distribution.total,
      lowRisk: distribution.low_risk,
      mediumRisk: distribution.medium_risk,
      highRisk: distribution.high_risk,
      lowRiskPercentage: distribution.low_risk_percentage,
      mediumRiskPercentage: distribution.medium_risk_percentage,
      highRiskPercentage: distribution.high_risk_percentage,
    },
    recentAnalyses: recentAnalyses.map((analysis) => ({
      transactionId: analysis.transaction_id,
      beneficiary: analysis.beneficiary_name,
      country: analysis.beneficiary_country,
      amount: Number(analysis.amount),
      currency: analysis.currency,
      riskLevel: mapRiskLevel(analysis.risk_level),
      riskScore: analysis.risk_score,
      status: mapStatus(analysis.status),
      createdAt: analysis.created_at,
    })),
  }
}

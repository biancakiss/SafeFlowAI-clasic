import { ApiError, apiRequest } from './apiClient'
import { getStoredToken } from './authService'
import type {
  PaymentAnalysisInput,
  RecommendedAction,
  RiskAnalysisResult,
  RiskLevel,
  RiskRule,
  Transaction,
  TransactionStatus,
} from '../types'

export type BackendTransactionStatus =
  | 'approved'
  | 'in_review'
  | 'blocked'

export interface BackendTransactionResponse {
  id: number
  user_id: number
  transaction_id: string
  amount: number | string
  currency: string
  beneficiary_id: string
  beneficiary_name: string
  beneficiary_country: string
  payment_channel: string
  description: string | null
  status: BackendTransactionStatus
  created_at: string
}

export interface BackendTransactionDetailResponse
  extends BackendTransactionResponse {
  analysis_id: number | null
  risk_score: number | null
  risk_level: string | null
  triggered_rules: Array<Record<string, unknown>>
  recommended_action: string | null
}

export interface BackendAnalysisResponse {
  analysis_id: number
  message_id: number | null
  transaction_id: string | null
  user_id: number
  analysis_type: 'email' | 'sms' | 'transaction'
  predicted_class: string | null
  model_score: number | null
  risk_score: number
  risk_level: string
  status: BackendTransactionStatus | null
  recommended_action: string | null
  triggered_rules: Array<Record<string, unknown>>
  features: Record<string, unknown>
  model_version: string | null
  created_at: string | null
}

function requireToken(): string {
  const token = getStoredToken()

  if (!token) {
    throw new ApiError('Please sign in before using transactions.', 401)
  }

  return token
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseAnalysisResponse(value: unknown): BackendAnalysisResponse {
  if (!isRecord(value)) {
    throw new ApiError('The backend returned an invalid analysis response.', 0)
  }

  if (
    typeof value.analysis_id !== 'number' ||
    typeof value.user_id !== 'number' ||
    typeof value.risk_score !== 'number' ||
    typeof value.risk_level !== 'string' ||
    !Array.isArray(value.triggered_rules) ||
    !isRecord(value.features)
  ) {
    throw new ApiError('The backend returned an invalid analysis response.', 0)
  }

  return {
    analysis_id: value.analysis_id,
    message_id:
      typeof value.message_id === 'number' || value.message_id === null
        ? value.message_id
        : null,
    transaction_id:
      typeof value.transaction_id === 'string' || value.transaction_id === null
        ? value.transaction_id
        : null,
    user_id: value.user_id,
    analysis_type:
      value.analysis_type === 'email' || value.analysis_type === 'sms'
        ? value.analysis_type
        : 'transaction',
    predicted_class:
      typeof value.predicted_class === 'string' || value.predicted_class === null
        ? value.predicted_class
        : null,
    model_score:
      typeof value.model_score === 'number' || value.model_score === null
        ? value.model_score
        : null,
    risk_score: value.risk_score,
    risk_level: value.risk_level,
    status:
      value.status === 'approved' ||
      value.status === 'in_review' ||
      value.status === 'blocked'
        ? value.status
        : null,
    recommended_action:
      typeof value.recommended_action === 'string' ||
      value.recommended_action === null
        ? value.recommended_action
        : null,
    triggered_rules: value.triggered_rules.filter(isRecord),
    features: value.features,
    model_version:
      typeof value.model_version === 'string' || value.model_version === null
        ? value.model_version
        : null,
    created_at:
      typeof value.created_at === 'string' || value.created_at === null
        ? value.created_at
        : null,
  }
}

function mapRiskLevel(value: string | null | undefined): RiskLevel {
  const normalized = value?.toUpperCase()

  if (normalized === 'MEDIUM') return 'MEDIUM'
  if (normalized === 'HIGH') return 'HIGH'
  return 'LOW'
}

function mapStatus(value: BackendTransactionStatus): TransactionStatus {
  if (value === 'approved') return 'Approved'
  if (value === 'blocked') return 'Blocked'
  return 'In review'
}

function toBackendPaymentChannel(value: string): string {
  const normalized = value.trim().toLowerCase()

  if (normalized.includes('crypto')) return 'crypto_wallet'
  if (normalized.includes('wire') || normalized.includes('swift')) {
    return 'international_transfer'
  }
  if (normalized.includes('cash')) return 'cash_transfer'

  return value
}

function toFrontendPaymentChannel(value: string): string {
  if (value === 'international_transfer') return 'Bank Transfer (SWIFT)'
  if (value === 'crypto_wallet') return 'Cryptocurrency'
  if (value === 'cash_transfer') return 'Cash transfer'

  return value
}

function mapRecommendedAction(
  value: string | null | undefined,
  riskLevel: RiskLevel,
): RecommendedAction {
  const normalized = value?.toUpperCase()

  if (normalized === 'BLOCK') return 'BLOCK'
  if (normalized === 'REVIEW') return 'REVIEW'
  if (normalized === 'APPROVE' || normalized === 'ALLOW') return 'ALLOW'

  if (riskLevel === 'HIGH') return 'BLOCK'
  if (riskLevel === 'MEDIUM') return 'REVIEW'
  return 'ALLOW'
}

function mapTriggeredRules(
  rules: Array<Record<string, unknown>> | undefined,
): RiskRule[] {
  if (!rules) return []

  return rules.flatMap((rule): RiskRule[] => {
    const ruleName = rule.rule_name ?? rule.ruleName

    if (
      typeof ruleName !== 'string' ||
      typeof rule.points !== 'number' ||
      typeof rule.reason !== 'string'
    ) {
      return []
    }

    return [{
      ruleName,
      points: rule.points,
      reason: rule.reason,
    }]
  })
}

function getExplanation(riskLevel: RiskLevel): string {
  if (riskLevel === 'HIGH') {
    return 'Several risk indicators were detected. The payment should be blocked until the account holder confirms the intent.'
  }

  if (riskLevel === 'MEDIUM') {
    return 'Some unusual indicators were detected. Additional verification is recommended before releasing the payment.'
  }

  return 'No significant risk indicators were detected for this payment.'
}

export function mapBackendTransaction(
  transaction: BackendTransactionResponse | BackendTransactionDetailResponse,
): Transaction {
  const detail = transaction as Partial<BackendTransactionDetailResponse>
  const riskLevel = mapRiskLevel(detail.risk_level)
  const recommendedAction = mapRecommendedAction(
    detail.recommended_action,
    riskLevel,
  )

  return {
    id: transaction.transaction_id,
    analysisId:
      typeof detail.analysis_id === 'number' ? detail.analysis_id : undefined,
    beneficiary: transaction.beneficiary_name,
    country: transaction.beneficiary_country,
    amount: Number(transaction.amount),
    currency: transaction.currency,
    channel: toFrontendPaymentChannel(transaction.payment_channel),
    riskScore:
      typeof detail.risk_score === 'number' ? detail.risk_score : 0,
    riskLevel,
    status: mapStatus(transaction.status),
    createdAt: transaction.created_at,
    description: transaction.description ?? undefined,
    triggeredRules: mapTriggeredRules(detail.triggered_rules),
    descriptionSignals: [],
    recommendedAction,
    explanation: getExplanation(riskLevel),
  }
}

export function mapBackendAnalysis(
  response: BackendAnalysisResponse,
): RiskAnalysisResult {
  const riskLevel = mapRiskLevel(response.risk_level)

  return {
    analysisId: response.analysis_id,
    userId: response.user_id,
    transactionId: response.transaction_id ?? undefined,
    createdAt: response.created_at ?? undefined,
    riskScore: response.risk_score,
    riskLevel,
    status: response.status ? mapStatus(response.status) : undefined,
    triggeredRules: mapTriggeredRules(response.triggered_rules),
    descriptionSignals: [],
    recommendedAction: mapRecommendedAction(
      response.recommended_action,
      riskLevel,
    ),
    explanation: getExplanation(riskLevel),
  }
}

export async function analyzeBackendTransaction(
  payment: PaymentAnalysisInput,
): Promise<RiskAnalysisResult> {
  const date = new Date(`${payment.date}T00:00:00`)
  const createdAt = Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString()

  const response = await apiRequest<unknown>('/api/v1/transactions/analyze', {
    method: 'POST',
    token: requireToken(),
    body: JSON.stringify({
      amount: payment.amount,
      currency: payment.currency,
      beneficiary_name: payment.beneficiary,
      beneficiary_country: payment.country,
      payment_channel: toBackendPaymentChannel(payment.paymentChannel),
      description: payment.description || null,
      created_at: createdAt,
    }),
  })

  return mapBackendAnalysis(parseAnalysisResponse(response))
}

export async function listBackendTransactions(): Promise<Transaction[]> {
  const transactions = await apiRequest<BackendTransactionResponse[]>(
    '/api/v1/transactions/?skip=0&limit=100',
    { token: requireToken() },
  )

  const details = await Promise.all(
    transactions.map((transaction) =>
      getBackendTransaction(transaction.transaction_id),
    ),
  )

  return details
}

export async function getBackendTransaction(
  id: string,
): Promise<Transaction> {
  const transaction = await apiRequest<BackendTransactionDetailResponse>(
    `/api/v1/transactions/${encodeURIComponent(id)}`,
    { token: requireToken() },
  )

  return mapBackendTransaction(transaction)
}

export async function updateBackendTransactionStatus(
  id: string,
  status: TransactionStatus,
): Promise<BackendTransactionResponse> {
  const backendStatus: BackendTransactionStatus =
    status === 'Approved'
      ? 'approved'
      : status === 'Blocked'
        ? 'blocked'
        : 'in_review'

  return apiRequest<BackendTransactionResponse>(
    `/api/v1/transactions/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      token: requireToken(),
      body: JSON.stringify({ status: backendStatus }),
    },
  )
}

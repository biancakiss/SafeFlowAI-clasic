import type {
  PaymentAnalysisInput,
  RecommendedAction,
  RiskAnalysisRequest,
  RiskAnalysisResult,
  RiskLevel,
  RiskRule,
} from '../types'

import { environment } from '../config/environment'
import { ApiError, apiRequest } from './apiClient'
import { ACCESS_TOKEN_KEY } from './authService'

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))

const knownCountries = new Set([
  'Romania',
  'Germany',
  'United Kingdom',
])

const descriptionRules = [
  {
    pattern: /guaranteed|risk[- ]?free|100%|guarantee/i,
    label: 'Guaranteed or risk-free return language',
    points: 15,
  },
  {
    pattern: /send now|urgent|immediately|limited time/i,
    label: 'Urgency or pressure language',
    points: 10,
  },
  {
    pattern: /investment|crypto|profit|return/i,
    label: 'Investment-related wording',
    points: 8,
  },
]

interface BackendRiskRule {
  rule_name: string
  points: number
  reason: string
}

interface BackendRiskResponse {
  analysis_id: number
  user_id: number
  analysis_type: string
  predicted_class: string | null
  risk_score: number
  risk_level: RiskLevel
  triggered_rules: BackendRiskRule[]
  features: Record<string, unknown>
  model_version: string | null
  created_at: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isRiskLevel(value: unknown): value is RiskLevel {
  return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH'
}

function parseBackendRiskResponse(body: unknown): BackendRiskResponse {
  if (!isRecord(body)) {
    throw new ApiError('The backend returned an invalid risk analysis response.', 0)
  }

  const rules = body.triggered_rules

  if (
    typeof body.analysis_id !== 'number' ||
    typeof body.user_id !== 'number' ||
    typeof body.risk_score !== 'number' ||
    !isRiskLevel(body.risk_level) ||
    !Array.isArray(rules) ||
    typeof body.created_at !== 'string'
  ) {
    throw new ApiError('The backend returned an invalid risk analysis response.', 0)
  }

  const validRules = rules.every(
    (rule) =>
      isRecord(rule) &&
      typeof rule.rule_name === 'string' &&
      typeof rule.points === 'number' &&
      typeof rule.reason === 'string',
  )

  if (!validRules) {
    throw new ApiError('The backend returned invalid risk factors.', 0)
  }

  return {
    analysis_id: body.analysis_id,
    user_id: body.user_id,
    analysis_type:
      typeof body.analysis_type === 'string'
        ? body.analysis_type
        : 'transaction',
    predicted_class:
      typeof body.predicted_class === 'string' || body.predicted_class === null
        ? body.predicted_class
        : null,
    risk_score: body.risk_score,
    risk_level: body.risk_level,
    triggered_rules: rules as BackendRiskRule[],
    features: isRecord(body.features) ? body.features : {},
    model_version:
      typeof body.model_version === 'string' || body.model_version === null
        ? body.model_version
        : null,
    created_at: body.created_at,
  }
}

function toRiskRule(rule: BackendRiskRule): RiskRule {
  return {
    ruleName: rule.rule_name,
    points: rule.points,
    reason: rule.reason,
  }
}

function getRecommendedAction(riskLevel: RiskLevel): RecommendedAction {
  if (riskLevel === 'HIGH') return 'BLOCK'
  if (riskLevel === 'MEDIUM') return 'REVIEW'
  return 'ALLOW'
}

function getExplanation(riskLevel: RiskLevel): string {
  if (riskLevel === 'HIGH') {
    return 'Multiple risk indicators require the payment to be stopped and reviewed.'
  }

  if (riskLevel === 'MEDIUM') {
    return 'Some risk indicators were found. Ask the customer for additional verification.'
  }

  return 'No significant scam indicators were detected for this payment.'
}

export async function analyzePaymentMock(
  payment: PaymentAnalysisInput,
): Promise<RiskAnalysisResult> {
  await delay(650)

  let riskScore = 0
  const triggeredRules: RiskRule[] = []
  const descriptionSignals: string[] = []

  // These features remain hidden from the operator in the UI.
  const hiddenFeatures = {
    is_unusually_large: payment.amount >= 10_000 ? 1 : 0,
    is_unusual_country: knownCountries.has(payment.country) ? 0 : 1,
    is_risky_payment_channel:
      /crypto|wire|api/i.test(payment.paymentChannel) ? 1 : 0,
  }

  if (hiddenFeatures.is_unusually_large) {
    riskScore += 20
    triggeredRules.push({
      ruleName: 'unusually_large_amount',
      points: 20,
      reason: 'The transaction amount is unusually large.',
    })
  }

  if (hiddenFeatures.is_unusual_country) {
    riskScore += 15
    triggeredRules.push({
      ruleName: 'unusual_country',
      points: 15,
      reason: 'The beneficiary country is unusual for this user.',
    })
  }

  if (hiddenFeatures.is_risky_payment_channel) {
    riskScore += 10
    triggeredRules.push({
      ruleName: 'risky_payment_channel',
      points: 10,
      reason: 'The payment channel is associated with increased risk.',
    })
  }

  for (const rule of descriptionRules) {
    if (rule.pattern.test(payment.description)) {
      riskScore += rule.points
      descriptionSignals.push(rule.label)
    }
  }

  const finalScore = Math.min(riskScore, 100)

  const riskLevel: RiskLevel =
    finalScore >= 60 ? 'HIGH' : finalScore >= 30 ? 'MEDIUM' : 'LOW'

  const recommendedAction = getRecommendedAction(riskLevel)

  const explanation =
    riskLevel === 'HIGH'
      ? 'Several risk indicators were detected. The payment should be blocked until the account holder confirms the intent.'
      : riskLevel === 'MEDIUM'
        ? 'Some unusual indicators were detected. Additional verification is recommended before releasing the payment.'
        : 'No significant risk indicators were detected for this payment.'

  return {
    riskScore: finalScore,
    riskLevel,
    triggeredRules,
    descriptionSignals,
    recommendedAction,
    explanation,
    createdAt: new Date().toISOString(),
  }
}

function toCurrentBackendPayload(
  payment: PaymentAnalysisInput,
): RiskAnalysisRequest {
  const amount = Number(payment.amount)

  // The current backend accepts only internal flags. Keep this adapter
  // centralized until the backend accepts the complete payment payload.
  return {
    is_new_beneficiary: 0,
    is_unusually_large: amount >= 10000 ? 1 : 0,
    recent_transaction_count: 0,
    is_unusual_country: !knownCountries.has(payment.country) ? 1 : 0,
    is_risky_payment_channel: /crypto|wire|api/i.test(
      payment.paymentChannel,
    )
      ? 1
      : 0,
  }
}

async function analyzePaymentApi(
  payment: PaymentAnalysisInput,
): Promise<RiskAnalysisResult> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)

  if (!token) {
    throw new ApiError('Please sign in before analyzing a payment.', 401)
  }

  const rawResponse = await apiRequest<unknown>(
    '/api/v1/risk/analyze',
    {
      method: 'POST',
      token,
      body: JSON.stringify(toCurrentBackendPayload(payment)),
    },
  )
  const response = parseBackendRiskResponse(rawResponse)

  return {
    analysisId: response.analysis_id,
    userId: response.user_id,
    createdAt: response.created_at,
    riskScore: response.risk_score,
    riskLevel: response.risk_level,
    triggeredRules: response.triggered_rules.map(toRiskRule),
    descriptionSignals: [],
    recommendedAction: getRecommendedAction(response.risk_level),
    explanation: getExplanation(response.risk_level),
  }
}

export async function analyzePayment(
  payment: PaymentAnalysisInput,
): Promise<RiskAnalysisResult> {
  if (environment.useMock) {
    return analyzePaymentMock(payment)
  }

  return analyzePaymentApi(payment)
}

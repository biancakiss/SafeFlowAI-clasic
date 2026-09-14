import type {
  PaymentAnalysisInput,
  RecommendedAction,
  RiskAnalysisResult,
  RiskLevel,
} from '../types'

import { environment } from '../config/environment'
import { apiRequest } from './apiClient'

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

interface BackendRiskResponse {
  risk_score: number
  risk_level: RiskLevel
  triggered_rules: string[]
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
  const triggeredRules: string[] = []
  const descriptionSignals: string[] = []

  //features hiden from user
  //in real version these should be calculated by the backend and not exposed to the frontend
  const hiddenFeatures = {
    is_unusually_large: payment.amount >= 10_000 ? 1 : 0,
    is_unusual_country: knownCountries.has(payment.country) ? 0 : 1,
    is_risky_payment_channel:
      /crypto|wire|api/i.test(payment.paymentChannel) ? 1 : 0,
  }

  if (hiddenFeatures.is_unusually_large) {
    riskScore += 20
    triggeredRules.push('Amount is unusually large')
  }

  if (hiddenFeatures.is_unusual_country) {
    riskScore += 15
    triggeredRules.push('Unusual destination country')
  }

  if (hiddenFeatures.is_risky_payment_channel) {
    riskScore += 10
    triggeredRules.push('Higher-risk payment channel')
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
  }
}

function toCurrentBackendPayload(payment: PaymentAnalysisInput) {
  const amount = Number(payment.amount)

  return {
    is_new_beneficiary: 0,
    is_unusually_large: amount >= 10000 ? 1 : 0,
    recent_transaction_count: 0,
    is_unusual_country:
      !['Romania', 'Germany', 'United Kingdom'].includes(payment.country)
        ? 1
        : 0,
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
  const token = localStorage.getItem('safeflow_access_token') ?? undefined

  const response = await apiRequest<BackendRiskResponse>(
    '/api/v1/risk/analyze',
    {
      method: 'POST',
      token,
      body: JSON.stringify(toCurrentBackendPayload(payment)),
    },
  )

  return {
    riskScore: response.risk_score,
    riskLevel: response.risk_level,
    triggeredRules: response.triggered_rules,
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


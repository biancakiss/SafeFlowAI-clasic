import type {
  PaymentAnalysisInput,
  RecommendedAction,
  RiskAnalysisResult,
  RiskLevel,
  RiskRule,
} from '../types'

import { environment } from '../config/environment'
import { analyzeBackendTransaction } from './transactionService'

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

function getRecommendedAction(riskLevel: RiskLevel): RecommendedAction {
  if (riskLevel === 'HIGH') return 'BLOCK'
  if (riskLevel === 'MEDIUM') return 'REVIEW'
  return 'ALLOW'
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
      /crypto|international_transfer|cash_withdrawal|wire|api/i.test(
        payment.paymentChannel,
      )
        ? 1
        : 0,
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
    status: 'In review',
    triggeredRules,
    descriptionSignals,
    recommendedAction,
    explanation,
    createdAt: new Date().toISOString(),
  }
}

async function analyzePaymentApi(
  payment: PaymentAnalysisInput,
): Promise<RiskAnalysisResult> {
  return analyzeBackendTransaction(payment)
}

export async function analyzePayment(
  payment: PaymentAnalysisInput,
): Promise<RiskAnalysisResult> {
  const analysis = environment.useMock
    ? await analyzePaymentMock(payment)
    : await analyzePaymentApi(payment)

  // every new analysis enters the analyst review workflow first
  // the final decision is made separately with Approve or Block
  return {
    ...analysis,
    status: 'In review',
  }
}

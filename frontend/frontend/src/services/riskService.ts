import type { RiskAnalysisRequest, RiskAnalysisResult, RiskLevel } from '../types'

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))

export async function analyzePaymentMock(
  request: RiskAnalysisRequest,
): Promise<RiskAnalysisResult> {
  await delay(650)

  let riskScore = 0
  const triggeredRules: string[] = []

  if (request.is_new_beneficiary) {
    riskScore += 15
    triggeredRules.push('New beneficiary')
  }

  if (request.is_unusually_large) {
    riskScore += 20
    triggeredRules.push('Unusually large amount')
  }

  if (request.recent_transaction_count >= 3) {
    riskScore += 25
    triggeredRules.push('Multiple recent transactions')
  }

  if (request.is_unusual_country) {
    riskScore += 15
    triggeredRules.push('Unusual destination country')
  }

  if (request.is_risky_payment_channel) {
    riskScore += 10
    triggeredRules.push('Higher-risk payment channel')
  }

  const riskLevel: RiskLevel =
    riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW'

  return {
    riskScore: Math.min(riskScore, 100),
    riskLevel,
    triggeredRules,
  }
}

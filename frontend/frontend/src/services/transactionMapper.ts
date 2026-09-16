import type {
  PaymentAnalysisInput,
  RecommendedAction,
  RiskAnalysisResult,
  Transaction,
  TransactionStatus,
} from '../types'

function getInitialStatus(
  action: RecommendedAction,
): TransactionStatus {
  if (action === 'BLOCK') {
    return 'Blocked'
  }

  if (action === 'REVIEW') {
    return 'In review'
  }

  return 'Approved'
}

function generateTransactionId(): string {
  const randomPart =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : Date.now().toString().slice(-8)

  return `SF-${randomPart}`
}

export function createTransactionFromAnalysis(
  payment: PaymentAnalysisInput,
  analysis: RiskAnalysisResult,
): 
    Transaction {
        return {
            id: generateTransactionId(),
            beneficiary: payment.beneficiary,
            country: payment.country,
            amount: payment.amount,
            currency: payment.currency,
            channel: payment.paymentChannel,
            riskScore: analysis.riskScore,
            riskLevel: analysis.riskLevel,
            status: getInitialStatus(analysis.recommendedAction),
            createdAt: new Date().toLocaleString('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
            }),
            description: payment.description,
            triggeredRules: analysis.triggeredRules,
            descriptionSignals: analysis.descriptionSignals,
            recommendedAction: analysis.recommendedAction,
            explanation: analysis.explanation,
        }
    }
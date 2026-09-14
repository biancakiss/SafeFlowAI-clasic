export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type TransactionStatus = 'Approved' | 'In review' | 'Blocked'

export type RecommendedAction = 'ALLOW' | 'REVIEW' | 'BLOCK'

export interface Transaction {
  id: string
  beneficiary: string
  country: string
  amount: number
  currency: string
  channel: string
  riskScore: number
  riskLevel: RiskLevel
  status: TransactionStatus
  createdAt: string
}

export interface PaymentAnalysisInput {
  amount: number
  currency: string
  date: string
  beneficiary: string
  country: string
  paymentChannel: string
  description: string
}

export interface RiskAnalysisRequest {
  is_new_beneficiary: 0 | 1
  is_unusually_large: 0 | 1
  recent_transaction_count: number
  is_unusual_country: 0 | 1
  is_risky_payment_channel: 0 | 1

  //optional; maight be used in future if the backend is updated to support it with ml analysis for description of the transaction
  description?: string
}

export interface RiskAnalysisResult {
  riskScore: number
  riskLevel: RiskLevel
  triggeredRules: string[]
  descriptionSignals: string[]
  recommendedAction: RecommendedAction
  explanation: string

}

export interface RiskTrendPoint {
  day: string
  analyzed: number
  highRisk: number
}

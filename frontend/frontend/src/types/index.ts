export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type TransactionStatus = 'Approved' | 'In review' | 'Blocked'

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

export interface RiskAnalysisRequest {
  is_new_beneficiary: 0 | 1
  is_unusually_large: 0 | 1
  recent_transaction_count: number
  is_unusual_country: 0 | 1
  is_risky_payment_channel: 0 | 1
}

export interface RiskAnalysisResult {
  riskScore: number
  riskLevel: RiskLevel
  triggeredRules: string[]
}

export interface RiskTrendPoint {
  day: string
  analyzed: number
  highRisk: number
}

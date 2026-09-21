export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type TransactionStatus = 'Approved' | 'In review' | 'Blocked'

export type RecommendedAction = 'ALLOW' | 'REVIEW' | 'BLOCK'

export type MessageType = 'sms' | 'email'

export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  bank_name: string
  country: string
}

export interface RiskRule {
  ruleName: string
  points: number
  reason: string
}

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
  description?: string
  analysisId?: number
  triggeredRules?: RiskRule[]
  descriptionSignals?: string[]
  recommendedAction?: RecommendedAction
  explanation?: string
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
  analysisId?: number
  userId?: number
  transactionId?: string
  createdAt?: string
  riskScore: number
  riskLevel: RiskLevel
  status?: TransactionStatus
  triggeredRules: RiskRule[]
  descriptionSignals: string[]
  recommendedAction: RecommendedAction
  explanation: string
}

export interface DashboardSummary {
  paymentsAnalyzed: number
  highRiskPayments: number
  potentialLossPrevented: number
  safePaymentRate: number
}

export interface DashboardRiskActivityPoint {
  date: string
  analyzed: number
  highRisk: number
}

export interface DashboardRiskDistribution {
  total: number
  lowRisk: number
  mediumRisk: number
  highRisk: number
  lowRiskPercentage: number
  mediumRiskPercentage: number
  highRiskPercentage: number
}

export interface DashboardRecentAnalysis {
  transactionId: string
  beneficiary: string
  country: string
  amount: number
  currency: string
  riskLevel: RiskLevel
  riskScore: number
  status: TransactionStatus
  createdAt: string
}

export interface RiskTrendPoint {
  day: string
  analyzed: number
  highRisk: number
}

export interface GlobeLocation {
  city: string
  country: string
  lat: number
  lng: number
}

export interface ScamRoute {
  id: string
  source: GlobeLocation
  target: GlobeLocation
  riskLevel: RiskLevel
  riskScore: number
  scamType: string
  reports: number
  exposure: string
  summary: string
}


export type MessageClassification =
  | 'SAFE'
  | 'SPAM'
  | 'SUSPICIOUS'
  | 'POTENTIAL_PHISHING'

export type MessageRecommendedAction =
  | 'NO_ACTION'
  | 'VERIFY_SENDER'
  | 'DO_NOT_INTERACT'
  | 'REPORT_MESSAGE'

export interface MessageAnalysisInput {
  messageType: MessageType
  sender: string
  receiver: string
  subject: string
  body: string
}

export interface MessageAnalysisResult {
  analysisId?: number
  messageId?: number
  messageType: MessageType
  predictedClass?: string | null
  modelScore?: number | null
  riskScore: number
  riskLevel: RiskLevel
  classification: MessageClassification
  recommendedAction: MessageRecommendedAction
  triggeredRules: RiskRule[]
  explanation: string
  modelVersion?: string | null
  createdAt?: string | null
}


export type UrlClassification =
  | 'SAFE'
  | 'SUSPICIOUS'
  | 'POTENTIAL_PHISHING'

export type UrlRecommendedAction =
  | 'NO_ACTION'
  | 'VERIFY_DOMAIN'
  | 'DO_NOT_INTERACT'

export interface UrlAnalysisInput {
  url: string
}

export interface UrlAnalysisResult {
  analysisId?: number
  url: string
  predictedClass?: string | null
  modelScore?: number | null
  riskScore: number
  riskLevel: RiskLevel
  classification: UrlClassification
  recommendedAction: UrlRecommendedAction
  triggeredRules: RiskRule[]
  explanation: string
  modelVersion?: string | null
  createdAt?: string | null
}
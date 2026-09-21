import type {
  MessageAnalysisInput,
  MessageAnalysisResult,
  MessageClassification,
  MessageRecommendedAction,
  RiskLevel,
  RiskRule,
} from '../types'
import { apiRequest } from './apiClient'

interface BackendMessageRule {
  rule_name: string
  points: number
  reason: string
}

interface BackendMessageResponse {
  analysis_id?: number
  message_id?: number
  analysis_type: 'sms' | 'email'
  predicted_class?: string | null
  model_score?: number | null
  risk_score: number
  risk_level: RiskLevel
  recommended_action?: string | null
  triggered_rules: BackendMessageRule[]
  model_version?: string | null
  created_at?: string | null
}

function getClassification(
  riskLevel: RiskLevel,
  predictedClass?: string | null,
): MessageClassification {
  if (riskLevel === 'HIGH') {
    return 'POTENTIAL_PHISHING'
  }

  if (riskLevel === 'MEDIUM') {
    return 'SUSPICIOUS'
  }

  if (predictedClass === 'spam') {
    return 'SPAM'
  }

  return 'SAFE'
}

function getRecommendedAction(
  classification: MessageClassification,
): MessageRecommendedAction {
  if (classification === 'POTENTIAL_PHISHING') {
    return 'DO_NOT_INTERACT'
  }

  if (
    classification === 'SUSPICIOUS' ||
    classification === 'SPAM'
  ) {
    return 'VERIFY_SENDER'
  }

  return 'NO_ACTION'
}

function getExplanation(
  classification: MessageClassification,
): string {
  switch (classification) {
    case 'POTENTIAL_PHISHING':
      return 'Several phishing indicators were detected. Do not click links or share sensitive information.'

    case 'SUSPICIOUS':
      return 'The message contains unusual indicators. Verify the sender using an official channel.'

    case 'SPAM':
      return 'The message resembles unwanted or promotional content.'

    default:
      return 'No significant scam indicators were detected.'
  }
}

function mapRules(
  rules: BackendMessageRule[],
): RiskRule[] {
  return rules.map((rule) => ({
    ruleName: rule.rule_name,
    points: rule.points,
    reason: rule.reason,
  }))
}

function mapBackendResponse(
  response: BackendMessageResponse,
  messageType: MessageAnalysisInput['messageType'],
): MessageAnalysisResult {
  const classification = getClassification(
    response.risk_level,
    response.predicted_class,
  )

  return {
    analysisId: response.analysis_id,
    messageId: response.message_id,
    messageType,
    predictedClass: response.predicted_class,
    modelScore: response.model_score,
    riskScore: response.risk_score,
    riskLevel: response.risk_level,
    classification,
    recommendedAction: getRecommendedAction(
      classification,
    ),
    triggeredRules: mapRules(
      response.triggered_rules,
    ),
    explanation: getExplanation(classification),
    modelVersion: response.model_version,
    createdAt: response.created_at,
  }
}

export async function analyzeMessage(
  input: MessageAnalysisInput,
): Promise<MessageAnalysisResult> {
  const token =
    localStorage.getItem('safeflow_access_token') ??
    undefined

  const response = await apiRequest<BackendMessageResponse>(
    '/api/v1/messages/analyze',
    {
      method: 'POST',
      token,
      body: JSON.stringify({
        message_type: input.messageType,
        sender: input.sender || null,
        receiver: input.receiver || null,
        subject: input.subject || null,
        body: input.body,
      }),
    },
  )

  return mapBackendResponse(response, input.messageType)
}
import type {
  RiskLevel,
  RiskRule,
  UrlAnalysisInput,
  UrlAnalysisResult,
} from '../types'
import { apiRequest } from './apiClient'

interface BackendUrlRule {
  rule_name: string
  points: number
  reason: string
}

interface BackendUrlResponse {
  analysis_id?: number
  url: string
  predicted_class?: string | null
  model_score?: number | null
  risk_score: number
  risk_level: string
  recommended_action?: string | null
  triggered_rules: BackendUrlRule[]
  features?: Record<string, unknown>
  explanation?: string | null
  model_version?: string | null
  created_at?: string | null
}

function normalizeRiskLevel(value: string): RiskLevel {
  const normalized = value.toUpperCase()

  if (normalized === 'HIGH') {
    return 'HIGH'
  }

  if (normalized === 'MEDIUM') {
    return 'MEDIUM'
  }

  return 'LOW'
}

function getClassification(
  riskLevel: RiskLevel,
  predictedClass?: string | null,
): UrlAnalysisResult['classification'] {
  if (riskLevel === 'HIGH') {
    return 'POTENTIAL_PHISHING'
  }

  if (riskLevel === 'MEDIUM') {
    return 'SUSPICIOUS'
  }

  if (predictedClass?.toLowerCase() === 'suspicious') {
    return 'SUSPICIOUS'
  }

  return 'SAFE'
}

function getRecommendedAction(
  classification: UrlAnalysisResult['classification'],
): UrlAnalysisResult['recommendedAction'] {
  if (classification === 'POTENTIAL_PHISHING') {
    return 'DO_NOT_INTERACT'
  }

  if (classification === 'SUSPICIOUS') {
    return 'VERIFY_DOMAIN'
  }

  return 'NO_ACTION'
}

function getExplanation(
  classification: UrlAnalysisResult['classification'],
  rules: RiskRule[],
) {
  if (rules.length > 0) {
    return rules.map((rule) => rule.reason).join(' ')
  }

  if (classification === 'POTENTIAL_PHISHING') {
    return 'The URL contains multiple characteristics associated with phishing.'
  }

  if (classification === 'SUSPICIOUS') {
    return 'The URL contains characteristics that require additional verification.'
  }

  return 'No significant risk indicators were detected in the URL.'
}

function mapRule(rule: BackendUrlRule): RiskRule {
  return {
    ruleName: rule.rule_name,
    points: rule.points,
    reason: rule.reason,
  }
}

export async function analyzeUrl(
  input: UrlAnalysisInput,
): Promise<UrlAnalysisResult> {
  const token = localStorage.getItem('safeflow_access_token') ?? undefined

  const response = await apiRequest<BackendUrlResponse>(
    '/api/v1/urls/analyze',
    {
      method: 'POST',
      token,
      body: JSON.stringify({
        url: input.url.trim(),
      }),
    },
  )

  const triggeredRules = (response.triggered_rules ?? []).map(mapRule)
  const riskLevel = normalizeRiskLevel(response.risk_level)

  const classification = getClassification(
    riskLevel,
    response.predicted_class,
  )

  return {
    analysisId: response.analysis_id,
    url: response.url,
    predictedClass: response.predicted_class,
    modelScore: response.model_score,
    riskScore: response.risk_score,
    riskLevel,
    classification,
    recommendedAction:
      response.recommended_action as UrlAnalysisResult['recommendedAction'] ??
      getRecommendedAction(classification),
    triggeredRules,
    explanation:
      response.explanation ??
      getExplanation(classification, triggeredRules),
    modelVersion: response.model_version,
    createdAt: response.created_at,
  }
}
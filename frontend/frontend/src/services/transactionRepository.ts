import { recentTransactions } from '../mocks/dashboardData'
import { environment } from '../config/environment'
import type {
  RecommendedAction,
  RiskLevel,
  RiskRule,
  Transaction,
  TransactionStatus,
} from '../types'
import {
  getBackendTransaction,
  listBackendTransactions,
  mapBackendTransaction,
  updateBackendTransactionStatus,
} from './transactionService'

const STORAGE_KEY = 'safeflow_transactions_v1'

export interface TransactionRepository {
  list(): Promise<Transaction[]>
  getById(id: string): Promise<Transaction | null>
  save(transaction: Transaction): Promise<Transaction>
  updateStatus(
    id: string,
    status: TransactionStatus,
  ): Promise<Transaction | null>
}

function getSeedTransactions(): Transaction[] {
  return recentTransactions.map((transaction) => ({
    ...transaction,
  }))
}

function readStoredTransactions(): Transaction[] {
  if (typeof window === 'undefined') {
    return getSeedTransactions()
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)

    if (!storedValue) {
      const seedTransactions = getSeedTransactions()

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(seedTransactions),
      )

      return seedTransactions
    }

    const parsedValue: unknown = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return getSeedTransactions()
    }

    return parsedValue
      .map(normalizeTransaction)
      .filter((transaction): transaction is Transaction => transaction !== null)
  } catch {
    return getSeedTransactions()
  }
}

function writeTransactions(transactions: Transaction[]): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(transactions),
  )
}

export const transactionRepository: TransactionRepository = {
  async list() {
    if (!environment.useMock) {
      return listBackendTransactions()
    }

    return readStoredTransactions()
  },

  async getById(id) {
    if (!environment.useMock) {
      return getBackendTransaction(id)
    }

    const transactions = readStoredTransactions()

    return (
      transactions.find((transaction) => transaction.id === id) ??
      null
    )
  },

  async save(transaction) {
    const transactions = readStoredTransactions()

    const withoutDuplicate = transactions.filter(
      (item) => item.id !== transaction.id,
    )

    const updatedTransactions = [
      transaction,
      ...withoutDuplicate,
    ]

    writeTransactions(updatedTransactions)

    return transaction
  },

  async updateStatus(id, status) {
    const transactions = readStoredTransactions()
    const transaction = transactions.find((item) => item.id === id)

    if (!environment.useMock) {
      const backendTransaction = await updateBackendTransactionStatus(
        id,
        status,
      )

      const updatedTransaction = transaction
        ? { ...transaction, status }
        : mapBackendTransaction(backendTransaction)

      writeTransactions([
        updatedTransaction,
        ...transactions.filter((item) => item.id !== id),
      ])

      return updatedTransaction
    }

    if (!transaction) {
      return null
    }

    const updatedTransaction = {
      ...transaction,
      status,
    }

    const updatedTransactions = transactions.map((item) =>
      item.id === id ? updatedTransaction : item,
    )

    writeTransactions(updatedTransactions)

    return updatedTransaction
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isRiskLevel(value: unknown): value is RiskLevel {
  return value === 'LOW' || value === 'MEDIUM' || value === 'HIGH'
}

function isTransactionStatus(value: unknown): value is TransactionStatus {
  return value === 'Approved' || value === 'In review' || value === 'Blocked'
}

function isRecommendedAction(value: unknown): value is RecommendedAction {
  return value === 'ALLOW' || value === 'REVIEW' || value === 'BLOCK'
}

function normalizeTriggeredRules(value: unknown): RiskRule[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((rule): RiskRule[] => {
    if (typeof rule === 'string') {
      return [{ ruleName: rule, points: 0, reason: rule }]
    }

    if (!isRecord(rule)) {
      return []
    }

    if (
      typeof rule.ruleName === 'string' &&
      typeof rule.points === 'number' &&
      typeof rule.reason === 'string'
    ) {
      return [{
        ruleName: rule.ruleName,
        points: rule.points,
        reason: rule.reason,
      }]
    }

    if (
      typeof rule.rule_name === 'string' &&
      typeof rule.points === 'number' &&
      typeof rule.reason === 'string'
    ) {
      return [{
        ruleName: rule.rule_name,
        points: rule.points,
        reason: rule.reason,
      }]
    }

    return []
  })
}

function normalizeTransaction(value: unknown): Transaction | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.beneficiary !== 'string' ||
    typeof value.country !== 'string' ||
    typeof value.amount !== 'number' ||
    typeof value.currency !== 'string' ||
    typeof value.channel !== 'string' ||
    typeof value.riskScore !== 'number' ||
    !isRiskLevel(value.riskLevel) ||
    !isTransactionStatus(value.status) ||
    typeof value.createdAt !== 'string'
  ) {
    return null
  }

  const transaction: Transaction = {
    id: value.id,
    beneficiary: value.beneficiary,
    country: value.country,
    amount: value.amount,
    currency: value.currency,
    channel: value.channel,
    riskScore: value.riskScore,
    riskLevel: value.riskLevel,
    status: value.status,
    createdAt: value.createdAt,
    triggeredRules: normalizeTriggeredRules(value.triggeredRules),
  }

  if (typeof value.analysisId === 'number') {
    transaction.analysisId = value.analysisId
  }

  if (typeof value.description === 'string') {
    transaction.description = value.description
  }

  if (Array.isArray(value.descriptionSignals)) {
    transaction.descriptionSignals = value.descriptionSignals.filter(
      (signal): signal is string => typeof signal === 'string',
    )
  }

  if (isRecommendedAction(value.recommendedAction)) {
    transaction.recommendedAction = value.recommendedAction
  }

  if (typeof value.explanation === 'string') {
    transaction.explanation = value.explanation
  }

  return transaction
}

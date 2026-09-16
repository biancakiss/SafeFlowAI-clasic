import { recentTransactions } from '../mocks/dashboardData'
import type { Transaction, TransactionStatus } from '../types'

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

    return parsedValue as Transaction[]
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
    return readStoredTransactions()
  },

  async getById(id) {
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
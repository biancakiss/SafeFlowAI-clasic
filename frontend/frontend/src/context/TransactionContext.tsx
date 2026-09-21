import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { ApiError } from '../services/apiClient'
import { transactionRepository } from '../services/transactionRepository'
import { useAuth } from './AuthContext'
import type {
  Transaction,
  TransactionStatus,
} from '../types'

interface TransactionContextValue {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  refreshTransactions: () => Promise<void>
  saveTransaction: (
    transaction: Transaction,
  ) => Promise<Transaction>
  updateTransactionStatus: (
    id: string,
    status: TransactionStatus,
  ) => Promise<Transaction | null>
  getTransactionById: (
    id: string,
  ) => Transaction | undefined
}

const TransactionContext =
  createContext<TransactionContextValue | null>(null)

interface TransactionProviderProps {
  children: ReactNode
}

export function TransactionProvider({
  children,
}: TransactionProviderProps) {
  const { logout } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const storedTransactions =
        await transactionRepository.list()

      setTransactions(storedTransactions)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
      }

      setError(
        'Transactions could not be loaded. Please refresh the page.',
      )
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    void refreshTransactions()
  }, [refreshTransactions])

  const saveTransaction = useCallback(
    async (transaction: Transaction) => {
      try {
        const savedTransaction =
          await transactionRepository.save(transaction)

        setTransactions((current) => [
          savedTransaction,
          ...current.filter(
            (item) => item.id !== savedTransaction.id,
          ),
        ])

        return savedTransaction
      } catch {
        setError(
          'The transaction could not be saved. Please try again.',
        )

        throw new Error('Transaction could not be saved.')
      }
    },
    [],
  )

  const updateTransactionStatus = useCallback(
    async (id: string, status: TransactionStatus) => {
      try {
        const updatedTransaction =
          await transactionRepository.updateStatus(id, status)

        if (!updatedTransaction) {
          return null
        }

        setTransactions((current) =>
          current.map((transaction) =>
            transaction.id === id
              ? updatedTransaction
              : transaction,
          ),
        )

        return updatedTransaction
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          logout()
        }

        setError(
          'The transaction status could not be updated.',
        )

        return null
      }
    },
    [logout],
  )

  const getTransactionById = useCallback(
    (id: string) =>
      transactions.find((transaction) => transaction.id === id),
    [transactions],
  )

  const value = useMemo(
    () => ({
      transactions,
      loading,
      error,
      refreshTransactions,
      saveTransaction,
      updateTransactionStatus,
      getTransactionById,
    }),
    [
      transactions,
      loading,
      error,
      refreshTransactions,
      saveTransaction,
      updateTransactionStatus,
      getTransactionById,
    ],
  )

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  )
}

export function useTransactions() {
  const context = useContext(TransactionContext)

  if (!context) {
    throw new Error(
      'useTransactions must be used inside TransactionProvider.',
    )
  }

  return context
}

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
import {
  clearStoredToken,
  getCurrentUser,
  getStoredToken,
  loginUser,
  registerUser,
} from '../services/authService'
import type { LoginCredentials, RegistrationData } from '../services/authService'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegistrationData) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getStoredToken()

    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const currentUser = await getCurrentUser(token)
      setUser(currentUser)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearStoredToken()
      }

      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await loginUser(credentials)
    const currentUser = await getCurrentUser(response.access_token)
    setUser(currentUser)
  }, [])

  const register = useCallback(async (data: RegistrationData) => {
    await registerUser(data)
    await login({ email: data.email, password: data.password })
  }, [login])

  const logout = useCallback(() => {
    clearStoredToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}

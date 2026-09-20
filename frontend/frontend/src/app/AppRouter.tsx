import { lazy, Suspense } from 'react'
import { Box, CircularProgress } from '@mui/material'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router'
import { AppShell } from '../components/layout/AppShell'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { TransactionProvider } from '../context/TransactionContext'

const DashboardPage = lazy(async () => ({
  default: (await import('../pages/DashboardPage')).DashboardPage,
}))

const AnalyzePaymentPage = lazy(async () => ({
  default: (await import('../pages/AnalyzePaymentPage'))
    .AnalyzePaymentPage,
}))

const TransactionsPage = lazy(async () => ({
  default: (await import('../pages/TransactionsPage'))
    .TransactionsPage,
}))

const AnalysisDetailsPage = lazy(async () => ({
  default: (await import('../pages/AnalysisDetailsPage'))
    .AnalysisDetailsPage,
}))

const ProfilePage = lazy(async () => ({
  default: (await import('../pages/ProfilePage')).ProfilePage,
}))

const AuthPage = lazy(async () => ({
  default: (await import('../pages/AuthPage')).AuthPage,
}))

const MessageAnalysisPage = lazy(async () => ({
  default: (await import('../pages/MessageAnalysisPage')).MessageAnalysisPage,
}))

const UrlAnalysisPage = lazy(async () => ({
  default: (await import('../pages/UrlAnalysisPage')).UrlAnalysisPage,
}))

function PageLoader() {
  return (
    <Box sx={{ minHeight: 360, display: 'grid', placeItems: 'center' }}>
      <CircularProgress size={30} />
    </Box>
  )
}

function ProtectedLayout() {
  const { loading, isAuthenticated } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <TransactionProvider>
      <AppShell />
    </TransactionProvider>
  )
}

interface PublicRouteProps {
  mode: 'login' | 'register'
}

function PublicRoute({ mode }: PublicRouteProps) {
  const { loading, isAuthenticated } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <AuthPage mode={mode} />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/login"
              element={<PublicRoute mode="login" />}
            />
            <Route
              path="/register"
              element={<PublicRoute mode="register" />}
            />

            <Route element={<ProtectedLayout />}>
              <Route
                index
                element={<Navigate to="/dashboard" replace />}
              />
              <Route
                path="/dashboard"
                element={<DashboardPage />}
              />
              <Route
                path="/analyze"
                element={<AnalyzePaymentPage />}
              />
              <Route
                path="/message-analysis"
                element={<MessageAnalysisPage />}
              />
              <Route 
              path="/url-analysis" 
              element={<UrlAnalysisPage />} 
              />
              <Route
                path="/transactions"
                element={<TransactionsPage />}
              />
              <Route
                path="/analyses/:analysisId"
                element={<AnalysisDetailsPage />}
              />
              <Route
                path="/profile"
                element={<ProfilePage />}
              />
            </Route>

            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

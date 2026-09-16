import { lazy, Suspense } from 'react'
import { Box, CircularProgress } from '@mui/material'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router'
import { AppShell } from '../components/layout/AppShell'
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

function PageLoader() {
  return (
    <Box sx={{ minHeight: 360, display: 'grid', placeItems: 'center' }}>
      <CircularProgress size={30} />
    </Box>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <TransactionProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/login"
              element={<AuthPage mode="login" />}
            />
            <Route
              path="/register"
              element={<AuthPage mode="register" />}
            />

            <Route element={<AppShell />}>
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
      </TransactionProvider>
    </BrowserRouter>
  )
}
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Alert, Box, Button, Card, CardContent, Checkbox, FormControlLabel, Link, Stack, TextField, Typography } from '@mui/material'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'
import { Link as RouterLink } from 'react-router'
import { BrandMark } from '../components/common/BrandMark'
import { ApiError } from '../services/apiClient'
import { useAuth } from '../context/AuthContext'
import type { RegistrationData } from '../services/authService'
import { useNavigate } from 'react-router'

interface AuthPageProps {
  mode: 'login' | 'register'
}

interface AuthFormState {
  firstName: string
  lastName: string
  email: string
  bankName: string
  country: string
  password: string
  passwordConfirm: string
}

const initialForm: AuthFormState = {
  firstName: '',
  lastName: '',
  email: '',
  bankName: '',
  country: '',
  password: '',
  passwordConfirm: '',
}

function getAuthErrorMessage(error: unknown, registering: boolean): string {
  if (!(error instanceof ApiError)) {
    return 'The request could not be completed. Please try again.'
  }

  if (error.status === 401) {
    return 'The email or password is incorrect.'
  }

  if (error.status === 409) {
    return 'An account with this email already exists. Try signing in instead.'
  }

  if (error.status === 422) {
    return registering
      ? 'Check the registration fields and make sure both passwords match.'
      : 'Check that the email and password are valid.'
  }

  return error.message
}

export function AuthPage({ mode }: AuthPageProps) {
  const registering = mode === 'register'
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [form, setForm] = useState<AuthFormState>(initialForm)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const updateForm = (
    field: keyof AuthFormState,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }))
    setSubmitError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (registering && form.password !== form.passwordConfirm) {
      setSubmitError('The passwords do not match.')
      return
    }

    setLoading(true)
    setSubmitError(null)

    try {
      if (registering) {
        const registrationData: RegistrationData = {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim(),
          bank_name: form.bankName.trim(),
          country: form.country.trim(),
          password: form.password,
          password_confirm: form.passwordConfirm,
        }

        await register(registrationData)
      } else {
        await login({
          email: form.email.trim(),
          password: form.password,
        })
      }

      navigate('/dashboard', { replace: true })
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error, registering))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(420px, 0.9fr) minmax(520px, 1.1fr)' },
        backgroundColor: '#FFFFFF',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          color: '#FFFFFF',
          background:
            'radial-gradient(circle at 20% 20%, rgba(91,220,204,0.27), transparent 27%), linear-gradient(145deg, #081522, #0B3841)',
        }}
      >
        <BrandMark dark />
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 500 }}>
          <Box
            sx={{
              width: 58,
              height: 58,
              display: 'grid',
              placeItems: 'center',
              mb: 3,
              borderRadius: 3,
              color: '#082E2B',
              backgroundColor: '#73DED1',
            }}
          >
            <ShieldRoundedIcon fontSize="large" />
          </Box>
          <Typography sx={{ fontSize: 42, lineHeight: 1.1, fontWeight: 750, letterSpacing: '-0.045em' }}>
            Stop suspicious payments before money leaves the account.
          </Typography>
          <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.65)', fontSize: 17, lineHeight: 1.7 }}>
            SafeFlow combines payment context, reusable risk rules and explainable scoring in one analyst workspace.
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          SafeFlow AI · Internal demonstration environment
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 2, sm: 4 } }}>
        <Box sx={{ width: '100%', maxWidth: 460 }}>
          <Box sx={{ display: { xs: 'block', lg: 'none' }, mb: 4 }}>
            <BrandMark />
          </Box>
          <Typography variant="h1">{registering ? 'Create your account' : 'Welcome back'}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {registering
              ? 'Set up your analyst profile to access the SafeFlow workspace.'
              : 'Sign in to continue to the SafeFlow risk workspace.'}
          </Typography>

          <Card component="form" onSubmit={handleSubmit} sx={{ boxShadow: 'none' }}>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Stack spacing={2}>
                {registering && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                    <TextField
                      required
                      label="First name"
                      value={form.firstName}
                      onChange={(event) => updateForm('firstName', event)}
                    />
                    <TextField
                      required
                      label="Last name"
                      value={form.lastName}
                      onChange={(event) => updateForm('lastName', event)}
                    />
                  </Box>
                )}
                <TextField
                  required
                  type="email"
                  label="Work email"
                  value={form.email}
                  onChange={(event) => updateForm('email', event)}
                />
                {registering && (
                  <>
                    <TextField
                      required
                      label="Bank name"
                      value={form.bankName}
                      onChange={(event) => updateForm('bankName', event)}
                    />
                    <TextField
                      required
                      label="Country"
                      value={form.country}
                      onChange={(event) => updateForm('country', event)}
                    />
                  </>
                )}
                <TextField
                  required
                  type="password"
                  label="Password"
                  value={form.password}
                  onChange={(event) => updateForm('password', event)}
                  slotProps={{ htmlInput: { minLength: 8 } }}
                />
                {registering && (
                  <TextField
                    required
                    type="password"
                    label="Confirm password"
                    value={form.passwordConfirm}
                    onChange={(event) => updateForm('passwordConfirm', event)}
                    slotProps={{ htmlInput: { minLength: 8 } }}
                  />
                )}
                {!registering && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <FormControlLabel control={<Checkbox size="small" />} label="Remember me" />
                    <Link component="button" type="button" underline="hover">
                      Forgot password?
                    </Link>
                  </Box>
                )}
                {submitError && <Alert severity="error">{submitError}</Alert>}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  endIcon={<ArrowForwardRoundedIcon />}
                >
                  {loading
                    ? registering
                      ? 'Creating account...'
                      : 'Signing in...'
                    : registering
                      ? 'Create account'
                      : 'Sign in'}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            {registering ? 'Already have an account?' : 'New to SafeFlow?'}{' '}
            <Link component={RouterLink} to={registering ? '/login' : '/register'} sx={{ fontWeight: 700 }}>
              {registering ? 'Sign in' : 'Create an account'}
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormHelperText,
  FormLabel,
  InputAdornment,
  OutlinedInput,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import { PageHeader } from '../components/common/PageHeader'
import { useAuth } from '../context/AuthContext'

/** Only editable profile fields belong in the update payload. */
export interface ProfileUpdates {
  first_name: string
  last_name: string
  bank_name: string
  country: string
}

export interface ProfilePageProps {
  /**
   * Persist the update and refresh AuthContext before resolving.
   * Reject on failure. Without a handler, Save stays disabled: this page never
   * reports a successful save without persisting through the application.
   */
  onSave?: (updates: ProfileUpdates) => Promise<void> | void
}

type ProfileErrors = Partial<Record<keyof ProfileUpdates, string>>

interface ProfileFieldProps {
  id: string
  name: string
  label: string
  value: string
  onChange?: (value: string) => void
  autoComplete?: string
  readOnly?: boolean
  disabled?: boolean
  required?: boolean
  error?: string
  helperText?: string
  endAdornment?: ReactNode
}

function ProfileField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  readOnly = false,
  disabled = false,
  required = false,
  error,
  helperText,
  endAdornment,
}: ProfileFieldProps) {
  const help = error || helperText

  return (
    <FormControl fullWidth error={Boolean(error)} disabled={disabled}>
      <FormLabel
        htmlFor={id}
        sx={{
          mb: 1,
          color: '#101828',
          fontSize: 13,
          fontWeight: 600,
          '&.Mui-focused': { color: '#0E9384' },
        }}
      >
        {label}
      </FormLabel>
      <OutlinedInput
        id={id}
        name={name}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        autoComplete={autoComplete}
        readOnly={readOnly}
        required={required}
        aria-describedby={help ? `${id}-help` : undefined}
        endAdornment={endAdornment}
        sx={{
          minHeight: 46,
          borderRadius: '10px',
          fontSize: 14,
          bgcolor: readOnly ? '#F5F7FA' : '#FFFFFF',
          color: '#101828',
          '& input': {
            py: 1.5,
            px: 1.75,
            color: '#101828',
            WebkitTextFillColor: '#101828',
            '@media (pointer: coarse)': { fontSize: 16 },
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D8E0EA',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: readOnly
              ? '#C5D0DC'
              : 'rgba(14, 147, 132, 0.7)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0E9384',
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D14343',
          },
          '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D8E0EA',
          },
          '&.Mui-disabled input': {
            WebkitTextFillColor: 'rgba(16, 24, 40, 0.55)',
          },
        }}
      />
      {help && (
        <FormHelperText
          id={`${id}-help`}
          sx={{
            mx: 0,
            mt: 1,
            lineHeight: 1.5,
            color: error ? '#D14343' : '#667085',
          }}
        >
          {help}
        </FormHelperText>
      )}
    </FormControl>
  )
}

export function ProfilePage({ onSave }: ProfilePageProps = {}) {
  const { user, updateProfile } = useAuth()

  return (
    <ProfileSettingsForm
      key={user?.email ?? 'signed-out'}
      email={user?.email ?? ''}
      firstName={user?.first_name ?? ''}
      lastName={user?.last_name ?? ''}
      bankName={user?.bank_name ?? ''}
      country={user?.country ?? ''}
      onSave={onSave ?? updateProfile}
    />
  )
}

interface ProfileSettingsFormProps extends ProfilePageProps {
  email: string
  firstName: string
  lastName: string
  bankName: string
  country: string
}

function ProfileSettingsForm({
  email,
  firstName,
  lastName,
  bankName,
  country,
  onSave,
}: ProfileSettingsFormProps) {
  const accent = '#57D4C0'
  const [saved, setSaved] = useState<ProfileUpdates>(() => ({
    first_name: firstName,
    last_name: lastName,
    bank_name: bankName,
    country,
  }))
  const [values, setValues] = useState<ProfileUpdates>(saved)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const saveInFlight = useRef(false)

  // Also populate the form if the authenticated user arrives asynchronously.
  useEffect(() => {
    const next = {
      first_name: firstName,
      last_name: lastName,
      bank_name: bankName,
      country,
    }
    setSaved(next)
    setValues(next)
    setErrors({})
    setSaveError('')
  }, [firstName, lastName, bankName, country])

  const dirty = (Object.keys(values) as (keyof ProfileUpdates)[]).some(
    (field) => values[field] !== saved[field],
  )
  const displayName = [saved.first_name, saved.last_name].filter(Boolean).join(' ')
  const initials = [saved.first_name.trim()[0], saved.last_name.trim()[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase()
  const canSave = Boolean(onSave) && dirty && !saving

  const updateField = (field: keyof ProfileUpdates, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSaveError('')
    setSuccessOpen(false)
  }

  const discardChanges = () => {
    if (saveInFlight.current) return
    setValues({ ...saved })
    setErrors({})
    setSaveError('')
    setSuccessOpen(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onSave || !dirty || saveInFlight.current) return

    const next: ProfileUpdates = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      bank_name: values.bank_name.trim(),
      country: values.country.trim(),
    }
    const nextErrors: ProfileErrors = {}
    if (!next.first_name) nextErrors.first_name = 'Enter your first name.'
    if (!next.last_name) nextErrors.last_name = 'Enter your last name.'
    setErrors(nextErrors)

    const firstInvalid = (Object.keys(nextErrors) as (keyof ProfileUpdates)[])[0]
    if (firstInvalid) {
      const input = event.currentTarget.elements.namedItem(firstInvalid)
      if (input instanceof HTMLInputElement) input.focus()
      return
    }

    saveInFlight.current = true
    setSaving(true)
    setSaveError('')
    setSuccessOpen(false)

    try {
      await onSave(next)
      setSaved(next)
      setValues(next)
      setSuccessOpen(true)
    } catch {
      setSaveError('We could not save your changes. Please try again.')
    } finally {
      saveInFlight.current = false
      setSaving(false)
    }
  }

  const panelSx = {
    minWidth: 0,
    height: '100%',
    borderRadius: '16px',
    border: '1px solid',
    borderColor: 'rgba(14, 147, 132, 0.2)',
    backgroundColor: '#F4F7FB',
    color: '#101828',
    backgroundImage: 'none',
    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.08)',
    '& .MuiTypography-colorTextSecondary': {
      color: '#667085',
    },
  }
  const contentSx = {
    p: { xs: 2.5, md: 3 },
    '&:last-child': { pb: { xs: 2.5, md: 3 } },
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 68px)',
        mx: { xs: -2, sm: -3, xl: -4 },
        my: { xs: -2, sm: -3, xl: -4 },
        px: { xs: 2, sm: 3, xl: 4 },
        py: { xs: 2, sm: 3, xl: 4 },
        color: '#101828',
        backgroundColor: '#F4F7FB',
      }}
    >
      <Stack spacing={3} sx={{ width: '100%', maxWidth: 1160, mx: 'auto' }}>
        <Box
          sx={{
            '& h1': { color: '#101828' },
            '& p': { color: '#667085' },
          }}
        >
          <PageHeader
            title="Profile settings"
            description="Manage your personal details and organization information."
          />
        </Box>

      <Box
        component="section"
        aria-label="Profile overview"
        sx={{
          position: 'relative',
          isolation: 'isolate',
          overflow: 'hidden',
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: '18px',
          border: '1px solid',
          borderColor: alpha(accent, 0.28),
          background:
            'linear-gradient(135deg, rgba(22, 67, 75, 0.98), rgba(45, 144, 151, 0.98))',
          color: '#F4FBFA',
          '&::before, &::after': {
            content: '""',
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: -1,
            border: '1px solid',
            borderColor: alpha(accent, 0.12),
            borderRadius: '50%',
          },
          '&::before': { width: 330, height: 330, right: -85, top: -125 },
          '&::after': { width: 246, height: 246, right: -43, top: -83 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 2.5 } }}>
          <Avatar
            variant="rounded"
            sx={{
              width: { xs: 64, sm: 76 },
              height: { xs: 64, sm: 76 },
              flexShrink: 0,
              borderRadius: '22px',
              bgcolor: '#123E4A',
              color: '#FFFFFF',
              fontSize: { xs: 24, sm: 28 },
              fontWeight: 500,
              boxShadow: '0 6px 18px rgba(18, 62, 74, 0.12)',
            }}
          >
            {initials || 'SF'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                mb: 0.5,
                color: 'text.secondary',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
              }}
            >
              YOUR PROFILE
            </Typography>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: 23, sm: 28 },
                lineHeight: 1.25,
                letterSpacing: '-0.035em',
                fontWeight: 700,
                overflowWrap: 'anywhere',
              }}
            >
              {displayName || 'Your SafeFlow profile'}
            </Typography>
            {(saved.bank_name || saved.country) && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1.25 }}>
                {saved.bank_name && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                    <BusinessRoundedIcon sx={{ color: accent, fontSize: 16 }} />
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(232, 247, 244, 0.76)', overflowWrap: 'anywhere' }}
                    >
                      {saved.bank_name}
                    </Typography>
                  </Box>
                )}
                {saved.country && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                    <LocationOnOutlinedIcon sx={{ color: accent, fontSize: 16 }} />
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(232, 247, 244, 0.76)', overflowWrap: 'anywhere' }}
                    >
                      {saved.country}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Box component="form" onSubmit={handleSubmit} aria-busy={saving}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.2fr) minmax(0, 1fr)' },
            gap: 3,
          }}
        >
          <Card component="section" aria-labelledby="profile-personal-title" elevation={0} sx={panelSx}>
            <CardContent sx={contentSx}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <PersonOutlineRoundedIcon sx={{ fontSize: 21, color: accent }} />
                <Typography id="profile-personal-title" component="h2" sx={{ fontSize: 17, fontWeight: 700 }}>
                  Personal information
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 3 }}>
                How you appear in SafeFlow.
              </Typography>
              <Stack spacing={2.5}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
                  <ProfileField
                    id="profile-first-name"
                    name="first_name"
                    label="First name"
                    value={values.first_name}
                    autoComplete="given-name"
                    required
                    disabled={saving}
                    error={errors.first_name}
                    onChange={(value) => updateField('first_name', value)}
                  />
                  <ProfileField
                    id="profile-last-name"
                    name="last_name"
                    label="Last name"
                    value={values.last_name}
                    autoComplete="family-name"
                    required
                    disabled={saving}
                    error={errors.last_name}
                    onChange={(value) => updateField('last_name', value)}
                  />
                </Box>
                <ProfileField
                  id="profile-email"
                  name="email"
                  label="Work email"
                  value={email}
                  autoComplete="email"
                  readOnly
                  helperText="Your sign-in email cannot be changed here."
                  endAdornment={
                    <InputAdornment position="end">
                      <LockOutlinedIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                    </InputAdornment>
                  }
                />
              </Stack>
            </CardContent>
          </Card>

          <Card component="section" aria-labelledby="profile-organization-title" elevation={0} sx={panelSx}>
            <CardContent sx={contentSx}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <BusinessRoundedIcon sx={{ fontSize: 21, color: accent }} />
                <Typography id="profile-organization-title" component="h2" sx={{ fontSize: 17, fontWeight: 700 }}>
                  Organization
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 3 }}>
                Your bank and location details.
              </Typography>
              <Stack spacing={2.5}>
                <ProfileField
                  id="profile-bank"
                  name="bank_name"
                  label="Bank name"
                  value={values.bank_name}
                  autoComplete="organization"
                  disabled={saving}
                  onChange={(value) => updateField('bank_name', value)}
                />
                <ProfileField
                  id="profile-country"
                  name="country"
                  label="Country"
                  value={values.country}
                  autoComplete="country-name"
                  disabled={saving}
                  onChange={(value) => updateField('country', value)}
                />
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {saveError && <Alert severity="error" sx={{ mt: 3, borderRadius: '10px' }}>{saveError}</Alert>}

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            mt: 3,
            pt: 2.5,
            borderTop: '1px solid',
            borderColor: '#E6EAF0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} role="status" aria-live="polite">
            {!dirty && !saving && <CheckCircleOutlineRoundedIcon sx={{ fontSize: 17, color: 'text.secondary' }} />}
            {dirty && !saving && <Box aria-hidden="true" sx={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, bgcolor: accent }} />}
            <Typography variant="body2" color={dirty ? 'text.primary' : 'text.secondary'}>
              {saving
                ? 'Saving your changes…'
                : dirty && !onSave
                  ? 'Unsaved changes. Saving is currently unavailable.'
                  : dirty
                    ? 'You have unsaved changes'
                    : 'No unsaved changes'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexShrink: 0 }}>
            <Button
              type="button"
              variant="outlined"
              disabled={!dirty || saving}
              onClick={discardChanges}
              sx={{
                minHeight: 44,
                px: 2.25,
                borderRadius: '10px',
                borderColor: '#D8E0EA',
                color: '#101828',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#0E9384',
                  backgroundColor: 'rgba(14, 147, 132, 0.06)',
                },
              }}
            >
              Discard
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!canSave}
              disableElevation
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
              sx={{
                minHeight: 44,
                px: 2.5,
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: accent,
                color: '#10312D',
                '&:hover': { bgcolor: '#74DFCE' },
              }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={successOpen}
        autoHideDuration={4500}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setSuccessOpen(false)
        }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSuccessOpen(false)} sx={{ borderRadius: '10px' }}>
          Your profile has been updated.
        </Alert>
      </Snackbar>
    </Stack>
    </Box>
  )
}

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Rating,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { DashboardReview } from '../../types'

const REVIEWS_STORAGE_KEY = 'safeflow_dashboard_reviews'

const demoReviews: DashboardReview[] = [
  {
    id: 'demo-laura-costea',
    name: 'Laura Costea',
    role: 'Senior Data Analyst',
    rating: 5,
    text:
      'SafeFlow makes suspicious payments easy to review and keeps every risk signal in one clear place.',
    createdAt: '2026-01-01T09:00:00.000Z',
  },
  {
    id: 'demo-sebastian-sleam',
    name: 'Sebastian Sleam',
    role: '.NET Developer',
    rating: 4.6,
    text:
      'The transaction overview is fast to understand, even when several payments need attention at once.',
    createdAt: '2026-01-02T09:00:00.000Z',
  },
  {
    id: 'demo-iulia-alecu',
    name: 'Iulia Alecu',
    role: 'Senior Developer',
    rating: 5,
    text:
      'The explainable risk decision helps our team approve or block a payment with confidence.',
    createdAt: '2026-01-03T09:00:00.000Z',
  },
  {
    id: 'demo-cosmin-petriuc',
    name: 'Cosmin Petriuc',
    role: 'Developer',
    rating: 4.5,
    text:
      'Message and URL analysis create a complete fraud-prevention workflow instead of showing only a score.',
    createdAt: '2026-01-04T09:00:00.000Z',
  },
  {
    id: 'demo-ferdinand-cabat',
    name: 'Ferdinand Cabat',
    role: 'Python Developer',
    rating: 5,
    text:
      'The interface feels consistent and professional, while every case status remains easy to follow.',
    createdAt: '2026-01-05T09:00:00.000Z',
  },
  {
    id: 'demo-vlad-cicioc',
    name: 'Vlad Cicioc',
    role: 'Payment reviewer',
    rating: 5,
    text:
      'The visual risk levels help me prioritize reviews without losing the payment context behind them.',
    createdAt: '2026-01-06T09:00:00.000Z',
  },
  {
    id: 'demo-ionut-popescu',
    name: 'Ionut Popescu',
    role: 'Developer',
    rating: 4.6,
    text:
      'A clean workspace for understanding how payment, message and URL risk checks work together.',
    createdAt: '2026-01-07T09:00:00.000Z',
  },
  {
    id: 'demo-raluca-hazi',
    name: 'Raluca Hazi',
    role: 'Senior Data Engineer',
    rating: 5,
    text:
      'A clean workspace for understanding how payment, message and URL risk checks work together.',
    createdAt: '2026-01-08T09:00:00.000Z',
  },
]

const avatarColors = [
  '#0E9384',
  '#3156D3',
  '#14804A',
  '#7656C9',
  '#C06B24',
  '#167C8C',
  '#42526E',
  '#E18A2D',
]

type ReviewFormValues = {
  name: string
  role: string
  rating: number | null
  text: string
}

type ReviewFormErrors = Partial<Record<keyof ReviewFormValues, string>>

const emptyForm: ReviewFormValues = {
  name: '',
  role: '',
  rating: null,
  text: '',
}

function isDashboardReview(value: unknown): value is DashboardReview {
  if (typeof value !== 'object' || value === null) return false

  const review = value as Partial<DashboardReview>

  return (
    typeof review.id === 'string' &&
    typeof review.name === 'string' &&
    review.name.trim().length > 0 &&
    (typeof review.role === 'undefined' || typeof review.role === 'string') &&
    typeof review.rating === 'number' &&
    review.rating >= 1 &&
    review.rating <= 5 &&
    typeof review.text === 'string' &&
    review.text.trim().length > 0 &&
    typeof review.createdAt === 'string'
  )
}

function loadStoredReviews(): DashboardReview[] {
  try {
    const rawReviews = window.localStorage.getItem(REVIEWS_STORAGE_KEY)
    if (!rawReviews) return []

    const parsedReviews: unknown = JSON.parse(rawReviews)
    return Array.isArray(parsedReviews)
      ? parsedReviews.filter(isDashboardReview)
      : []
  } catch {
    return []
  }
}

function saveStoredReviews(reviews: DashboardReview[]): void {
  try {
    window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews))
  } catch {
    // Storage can be unavailable in private browsing or when its quota is full.
  }
}

function calculateAverageRating(reviews: DashboardReview[]): number {
  if (reviews.length === 0) return 0

  const average = reviews.reduce((total, review) => total + review.rating, 0) /
    reviews.length

  return Math.round(average * 100) / 100
}

function generateInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

function generateReviewId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function validateReview(values: ReviewFormValues): ReviewFormErrors {
  const errors: ReviewFormErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Name is required.'
  }

  if (values.rating === null || values.rating < 1 || values.rating > 5) {
    errors.rating = 'Please choose a rating from 1 to 5 stars.'
  }

  if (!values.text.trim()) {
    errors.text = 'Feedback is required.'
  }

  return errors
}

export function DemoReviewsSection() {
  const [reviews, setReviews] = useState<DashboardReview[]>(() => [
    ...loadStoredReviews(),
    ...demoReviews,
  ])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formValues, setFormValues] = useState<ReviewFormValues>(emptyForm)
  const [formErrors, setFormErrors] = useState<ReviewFormErrors>({})

  const averageRating = calculateAverageRating(reviews)

  const resetForm = () => {
    setFormValues(emptyForm)
    setFormErrors({})
  }

  const closeDialog = () => {
    if (isSubmitting) return
    setDialogOpen(false)
    resetForm()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const errors = validateReview(formValues)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)

    try {
      await Promise.resolve()

      const newReview: DashboardReview = {
        id: generateReviewId(),
        name: formValues.name.trim(),
        role: formValues.role.trim() || undefined,
        rating: formValues.rating as number,
        text: formValues.text.trim(),
        createdAt: new Date().toISOString(),
      }
      const storedReviews = loadStoredReviews()

      saveStoredReviews([newReview, ...storedReviews])
      setReviews((currentReviews) => [newReview, ...currentReviews])
      setDialogOpen(false)
      resetForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box component="section" aria-labelledby="demo-reviews-title">
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'flex-end' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              flexWrap: 'wrap',
            }}
          >
            <Typography id="demo-reviews-title" variant="h2">
              What famous users say
            </Typography>
            <Chip
              label="Feedback"
              size="small"
              variant="outlined"
              sx={{
                color: '#087467',
                borderColor: 'rgba(14,147,132,0.35)',
                backgroundColor: 'rgba(14,147,132,0.06)',
              }}
            />
          </Box>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Original feedback added to demonstrate the SafeFlow user experience.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 1.5,
            width: { xs: '100%', md: 'auto' },
            flexShrink: 0,
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setDialogOpen(true)}
            aria-label="Add feedback"
            sx={{ minHeight: 48, whiteSpace: 'nowrap' }}
          >
            Add feedback
          </Button>

          <Card
            sx={{
              width: { xs: '100%', md: 330 },
              flexShrink: 0,
              borderColor: 'rgba(14,147,132,0.22)',
              background:
                'linear-gradient(135deg, rgba(14,147,132,0.13), rgba(255,255,255,0.98))',
            }}
          >
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                py: 2,
                '&:last-child': { pb: 2 },
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography sx={{ fontSize: 36, lineHeight: 1, fontWeight: 800 }}>
                    {averageRating.toFixed(2)}
                  </Typography>
                  <Typography color="text.secondary">/ 5</Typography>
                </Box>
                <Rating
                  value={averageRating}
                  precision={0.01}
                  readOnly
                  size="small"
                  aria-label={`Overall rating: ${averageRating.toFixed(2)} out of 5 stars`}
                  sx={{ mt: 0.75, color: '#F4A62A' }}
                />
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Overall rating
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
            xl: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {reviews.map((review, index) => (
          <Card
            key={review.id}
            sx={{
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 160ms ease, box-shadow 160ms ease',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: '0 auto 0 0',
                width: 4,
                backgroundColor: index % 2 === 0 ? '#0E9384' : '#64E2D2',
              },
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 16px 34px rgba(20,39,64,0.11)',
              },
            }}
          >
            <CardContent
              sx={{
                p: 2.5,
                pl: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:last-child': { pb: 2.5 },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <FormatQuoteRoundedIcon
                  aria-hidden="true"
                  sx={{ color: 'rgba(14,147,132,0.22)', fontSize: 38 }}
                />
                <Rating
                  value={review.rating}
                  precision={0.1}
                  readOnly
                  size="small"
                  aria-label={`${review.rating} out of 5 stars`}
                  sx={{ color: '#F4A62A' }}
                />
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1.25, mb: 2.5, lineHeight: 1.7, flexGrow: 1 }}
              >
                “{review.text}”
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Avatar
                  sx={{
                    width: 42,
                    height: 42,
                    fontSize: 14,
                    fontWeight: 750,
                    backgroundColor: avatarColors[index % avatarColors.length],
                  }}
                >
                  {generateInitials(review.name)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 750 }} noWrap>
                      {review.name}
                    </Typography>
                    <VerifiedRoundedIcon
                      aria-hidden="true"
                      sx={{ fontSize: 16, color: 'primary.main' }}
                    />
                  </Box>
                  {review.role && (
                    <Typography variant="caption" color="text.secondary">
                      {review.role}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        aria-labelledby="add-feedback-dialog-title"
      >
        <DialogTitle id="add-feedback-dialog-title">Add feedback</DialogTitle>
        <form id="add-feedback-form" onSubmit={handleSubmit} noValidate>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
          <TextField
            label="Name"
            value={formValues.name}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, name: event.target.value }))
            }
            error={Boolean(formErrors.name)}
            helperText={formErrors.name}
            required
            autoFocus
            fullWidth
          />
          <TextField
            label="Role / profession"
            value={formValues.role}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, role: event.target.value }))
            }
            fullWidth
          />
          <Box>
            <Typography component="label" variant="body2" sx={{ display: 'block', mb: 0.5 }}>
              Rating <Box component="span" sx={{ color: 'error.main' }}>*</Box>
            </Typography>
            <Rating
              name="feedback-rating"
              value={formValues.rating}
              onChange={(_, value) =>
                setFormValues((current) => ({ ...current, rating: value }))
              }
              max={5}
              aria-label="Select a rating from 1 to 5 stars"
              sx={{ color: '#F4A62A' }}
            />
            {formErrors.rating && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: 'block' }}
              >
                {formErrors.rating}
              </Typography>
            )}
          </Box>
          <TextField
            label="Feedback"
            value={formValues.text}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, text: event.target.value }))
            }
            error={Boolean(formErrors.text)}
            helperText={formErrors.text}
            required
            multiline
            minRows={4}
            fullWidth
          />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={closeDialog} disabled={isSubmitting} variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="contained"
            >
              {isSubmitting ? 'Submitting…' : 'Submit feedback'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}

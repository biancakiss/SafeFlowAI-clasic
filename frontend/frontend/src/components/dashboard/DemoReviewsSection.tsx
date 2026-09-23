import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Rating,
  Typography,
} from '@mui/material'

type DemoReview = {
  name: string
  role: string
  initials: string
  rating: number
  comment: string
}

const demoReviews: DemoReview[] = [
  {
    name: 'Elena Marin',
    role: 'Fraud analyst',
    initials: 'EM',
    rating: 5,
    comment:
      'SafeFlow makes suspicious payments easy to review and keeps every risk signal in one clear place.',
  },
  {
    name: 'Andrei Ionescu',
    role: 'Payments specialist',
    initials: 'AI',
    rating: 5,
    comment:
      'The transaction overview is fast to understand, even when several payments need attention at once.',
  },
  {
    name: 'Ioana Dumitru',
    role: 'Risk operations lead',
    initials: 'ID',
    rating: 5,
    comment:
      'I like that the risk decision is explainable and the analyst can approve or block a payment immediately.',
  },
  {
    name: 'Radu Petrescu',
    role: 'Security analyst',
    initials: 'RP',
    rating: 5,
    comment:
      'Message and URL analysis give the dashboard a complete fraud-prevention workflow, not just a score.',
  },
  {
    name: 'Laura Pavel',
    role: 'Compliance specialist',
    initials: 'LP',
    rating: 5,
    comment:
      'The interface feels consistent and professional, while the status of each case remains easy to follow.',
  },
  {
    name: 'Mihai Stan',
    role: 'Payment reviewer',
    initials: 'MS',
    rating: 4.9,
    comment:
      'The visual risk levels help me prioritize reviews quickly without losing the underlying payment context.',
  },
  {
    name: 'Victor Ene',
    role: 'Fraud prevention officer',
    initials: 'VE',
    rating: 4.8,
    comment:
      'A clean and useful workspace for presenting how payment, message and URL risk checks work together.',
  },
]

const overallRating = (
  demoReviews.reduce((total, review) => total + review.rating, 0) /
  demoReviews.length
).toFixed(2)

const avatarColors = [
  '#0E9384',
  '#3156D3',
  '#14804A',
  '#7656C9',
  '#C06B24',
  '#167C8C',
  '#42526E',
]

export function DemoReviewsSection() {
  return (
    <Box component="section" aria-labelledby="demo-reviews-title">
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'flex-end' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              flexWrap: 'wrap',
            }}
          >
            <Typography id="demo-reviews-title" variant="h2">
              What analysts say
            </Typography>
            
          </Box>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Sample reviews created to demonstrate the SafeFlow user experience.
          </Typography>
        </Box>

        <Card
          sx={{
            width: { xs: '100%', md: 'auto' },
            minWidth: { md: 300 },
            borderColor: 'rgba(14,147,132,0.22)',
            background:
              'linear-gradient(135deg, rgba(14,147,132,0.12), rgba(255,255,255,0.96))',
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
                <Typography sx={{ fontSize: 34, lineHeight: 1, fontWeight: 800 }}>
                  {overallRating}
                </Typography>
                <Typography color="text.secondary">/ 5</Typography>
              </Box>
              <Rating
                value={Number(overallRating)}
                precision={0.01}
                readOnly
                size="small"
                sx={{ mt: 0.75, color: '#F4A62A' }}
              />
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Overall rating
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {demoReviews.length} sample reviews
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {demoReviews.map((review, index) => (
          <Card
            key={review.name}
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
                boxShadow: '0 16px 34px rgba(20, 39, 64, 0.11)',
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
                  sx={{ color: '#F4A62A' }}
                />
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1.25, mb: 2.5, lineHeight: 1.7, flexGrow: 1 }}
              >
                “{review.comment}”
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Avatar
                  sx={{
                    width: 42,
                    height: 42,
                    fontSize: 14,
                    fontWeight: 750,
                    backgroundColor: avatarColors[index],
                  }}
                >
                  {review.initials}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 750 }} noWrap>
                      {review.name}
                    </Typography>
                    <VerifiedRoundedIcon
                      aria-label="Demo profile"
                      sx={{ fontSize: 16, color: 'primary.main' }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {review.role}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

# SafeFlow AI Frontend

React + TypeScript frontend for a payment scam detection and risk analysis demo.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`.

## Quality checks

```bash
npm run lint
npm run build
```

## Available routes

- `/login` and `/register` - authentication UI
- `/dashboard` - operational risk overview
- `/analyze` - pre-payment risk analysis
- `/transactions` - searchable transaction list
- `/analyses/:analysisId` - explainable analysis result
- `/profile` - analyst profile

## Source structure

- `app/` - routing and application-level configuration
- `components/common/` - reusable presentational components
- `components/layout/` - application shell and navigation
- `mocks/` - temporary frontend data
- `pages/` - route-level screens
- `services/` - API and mock service functions
- `theme/` - MUI design tokens and component defaults
- `types/` - shared TypeScript contracts

## Backend integration

The current `analyzePaymentMock` function is intentionally isolated in
`src/services/riskService.ts`. Its request uses the existing FastAPI feature names:

- `is_new_beneficiary`
- `is_unusually_large`
- `recent_transaction_count`
- `is_unusual_country`
- `is_risky_payment_channel`

When the backend is ready, replace the mock implementation with an HTTP request while
keeping the page and shared TypeScript types unchanged.

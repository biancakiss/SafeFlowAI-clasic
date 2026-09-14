import { alpha, createTheme } from '@mui/material/styles'

const navy = '#0B1728'
const teal = '#0E9384'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: teal,
      dark: '#087467',
      light: '#62CEC1',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#3156D3',
    },
    success: {
      main: '#14804A',
    },
    warning: {
      main: '#C76A12',
    },
    error: {
      main: '#D14343',
    },
    background: {
      default: '#F4F7FB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#101828',
      secondary: '#667085',
    },
    divider: '#E6EAF0',
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    h1: {
      fontSize: '2rem',
      lineHeight: 1.2,
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h2: {
      fontSize: '1.45rem',
      lineHeight: 1.3,
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.05rem',
      lineHeight: 1.4,
      fontWeight: 650,
    },
    button: {
      fontWeight: 650,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(circle at 85% 0%, rgba(14, 147, 132, 0.07), transparent 26%)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 42,
          borderRadius: 10,
          paddingInline: 18,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E7EBF1',
          boxShadow: '0 8px 30px rgba(16, 24, 40, 0.045)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 650,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderRadius: 10,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(teal, 0.6),
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: navy,
          borderRadius: 8,
          fontSize: 12,
        },
      },
    },
  },
})

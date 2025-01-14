import { colors, createTheme, responsiveFontSizes } from '@mui/material';

// Create a theme instance.
const base_theme = createTheme({
  palette: {
    primary: {
      main: colors.blue[600],
    },
    secondary: {
      main: colors.purple[200],
    },
    error: {
      main: colors.red.A400,
    },
  },
  typography: {
    h1: {
      fontSize: '3rem',
    },
    h2: {
      fontSize: '2.5rem',
    },
    h3: {
      fontSize: '2rem',
    },
    h4: {
      fontSize: '1.6rem',
    },
    h5: {
      fontSize: '1.3rem',
    },
    h6: {
      fontSize: '1.1rem',
    },
  },
  // for MUI6 to auto-switch dark/light
  cssVariables: true,
  colorSchemes: {
    dark: true,
  },
});

export const theme = responsiveFontSizes(base_theme);

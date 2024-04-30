import { createTheme } from '@mui/material/styles';
import { red, blue, purple } from '@mui/material/colors';

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: blue[600],
    },
    secondary: {
      main: purple[200],
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;

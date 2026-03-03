import { createTheme } from "@mui/material/styles";

const shared = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
};

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: "light",
    primary: { main: "#e10600" },
  },
});

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary: { main: "#e10600" },
    background: {
      default: "#111827",
      paper: "#1f2937",
    },
  },
});

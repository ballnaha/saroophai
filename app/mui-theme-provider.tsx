"use client";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import type { ReactNode } from "react";

const theme = createTheme({
  typography: {
    fontFamily: "var(--font-sarabun), Arial, sans-serif",
    allVariants: {
      letterSpacing: 0,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: "var(--font-sarabun), Arial, sans-serif",
        },
        button: {
          fontFamily: "var(--font-sarabun), Arial, sans-serif",
        },
        input: {
          fontFamily: "var(--font-sarabun), Arial, sans-serif",
        },
        textarea: {
          fontFamily: "var(--font-sarabun), Arial, sans-serif",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          letterSpacing: 0,
          textTransform: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          letterSpacing: 0,
        },
      },
    },
  },
});

export function MuiThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

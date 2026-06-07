"use client";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import type { ReactNode } from "react";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0071e3",
      dark: "#005bb5",
      contrastText: "#ffffff",
    },
    success: {
      main: "#34c759",
    },
    background: {
      default: "#f5f6f8",
      paper: "rgba(255,255,255,0.82)",
    },
    text: {
      primary: "#1d1d1f",
      secondary: "#6e6e73",
    },
    divider: "rgba(0,0,0,0.08)",
  },
  shape: {
    borderRadius: 4,
  },
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
          borderRadius: 12,
          fontWeight: 700,
          boxShadow: "none",
        },
        contained: {
          background: "linear-gradient(180deg, #0a84ff 0%, #0071e3 100%)",
          boxShadow: "0 10px 24px rgba(0, 113, 227, 0.22)",
          "&:hover": {
            boxShadow: "0 12px 28px rgba(0, 113, 227, 0.26)",
          },
        },
        outlined: {
          borderColor: "rgba(0,0,0,0.12)",
          backgroundColor: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(18px)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderColor: "rgba(0,0,0,0.08)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.2)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.78)",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0,0,0,0.12)",
          },
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0,0,0,0.2)",
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#0071e3",
            borderWidth: 1,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          letterSpacing: 0,
          borderRadius: 999,
          fontWeight: 700,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 36,
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

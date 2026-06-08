"use client";

import { Box, Button, Typography } from "@mui/material";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function LoginButton({
  variant,
  startIcon,
  endIcon,
  label,
  provider,
  sx,
}: {
  variant: "contained" | "outlined";
  startIcon: React.ReactNode;
  endIcon: React.ReactNode;
  label: string;
  provider: "line" | "google";
  sx: Record<string, unknown>;
}) {
  const { pending } = useFormStatus();

  const isLine = provider === "line";

  return (
    <Button
      type="submit"
      fullWidth
      variant={variant}
      disabled={pending}
      sx={{
        position: "relative",
        height: 52,
        borderRadius: "14px",
        fontWeight: 600,
        justifyContent: "flex-start",
        px: 2,
        textTransform: "none",
        fontSize: 15,
        letterSpacing: "-0.01em",
        overflow: "hidden",
        transition: "all 220ms cubic-bezier(0.2, 0.8, 0.4, 1)",

        // Muted disabled state
        "&.Mui-disabled": {
          opacity: 0.72,
          filter: "grayscale(15%)",
        },

        // Icon spacing
        "& .MuiButton-startIcon": {
          mr: 1.5,
          ml: 0.25,
        },
        "& .MuiButton-endIcon": {
          ml: "auto",
          mr: 0.25,
          transition: "transform 220ms cubic-bezier(0.2, 0.8, 0.4, 1)",
        },

        // Hover: slide end icon right
        "&:hover .MuiButton-endIcon": {
          transform: pending ? "none" : "translateX(3px)",
        },

        ...sx,
      }}
    >
      {/* Background shimmer on hover */}
      {!pending && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "14px",
            opacity: 0,
            background: isLine
              ? "linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 100%)"
              : "linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0) 100%)",
            transition: "opacity 350ms ease",
            pointerEvents: "none",
          }}
          className="login-btn-shimmer"
        />
      )}

      {/* Pending: animated progress bar at top */}
      {pending && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2.5,
            background: isLine
              ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)"
              : "linear-gradient(90deg, transparent, rgba(0,0,0,0.15), transparent)",
            animation: "login-progress 1.4s ease-in-out infinite",
            "@keyframes login-progress": {
              "0%": { transform: "translateX(-100%)" },
              "100%": { transform: "translateX(100%)" },
            },
          }}
        />
      )}

      {/* Start icon */}
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          flexShrink: 0,
          mr: 1.5,
          ml: 0.25,
          "& img, & svg": { display: "block" },
        }}
      >
        {pending ? (
          <Loader2 size={20} className="app-spin" />
        ) : (
          startIcon
        )}
      </Box>

      {/* Label text */}
      <Typography
        component="span"
        sx={{
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        {pending ? "กำลังเข้าสู่ระบบ..." : label}
      </Typography>

      {/* End icon */}
      <Box component="span" sx={{ ml: "auto", display: "inline-flex", alignItems: "center", mr: 0.25 }}>
        {endIcon}
      </Box>
    </Button>
  );
}
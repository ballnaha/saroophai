"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { IconButton, Tooltip } from "@mui/material";

export function SignOutButton() {
  return (
    <Tooltip title="ออกจากระบบ" placement="bottom">
      <IconButton
        onClick={() => signOut({ callbackUrl: "/login" })}
        sx={{
          color: "#71717a",
          borderRadius: 2,
          width: 36,
          height: 36,
          border: "1px solid #e4e4e7",
          bgcolor: "#fff",
          transition: "all 150ms ease",
          "&:hover": {
            borderColor: "#d4d4d8",
            bgcolor: "#f4f4f5",
            color: "#e11d48", // soft destructive red on hover
          },
          "&:active": {
            transform: "scale(0.95)",
          },
        }}
      >
        <LogOut size={16} />
      </IconButton>
    </Tooltip>
  );
}

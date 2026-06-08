"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { IconButton, Tooltip } from "@mui/material";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Tooltip title="ออกจากระบบ" placement="bottom">
      <IconButton
        onClick={handleSignOut}
        disabled={isLoading}
        sx={{
          color: isLoading ? "#a1a1aa" : "#71717a",
          borderRadius: 2,
          width: 36,
          height: 36,
          border: "1px solid #e4e4e7",
          bgcolor: "#fff",
          transition: "all 150ms ease",
          "&:hover": {
            borderColor: "#d4d4d8",
            bgcolor: "#f4f4f5",
            color: "#e11d48",
          },
          "&:active": {
            transform: "scale(0.95)",
          },
          "&.Mui-disabled": {
            bgcolor: "#fafafa",
            color: "#a1a1aa",
          },
        }}
      >
        {isLoading ? (
          <Loader2 size={16} className="app-spin" />
        ) : (
          <LogOut size={16} />
        )}
      </IconButton>
    </Tooltip>
  );
}

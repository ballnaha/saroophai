"use client";

import React, { useState, useEffect } from "react";
import { LineGroup } from "@/lib/MockData";
import { LineGroupSidebar } from "@/components/LineGroupSidebar";
import { SummaryDashboard } from "@/components/SummaryDashboard";
import { SystemStatusDashboard } from "@/components/SystemStatusDashboard";
import { SignOutButton } from "@/components/SignOutButton";
import { getLineGroups, toggleActionItemDb } from "@/app/actions/groups";
import { summarizeChat } from "@/app/actions/summarize";
import { MessageSquare, Menu } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

type DashboardAppProps = {
  userName?: string | null;
  userEmail?: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function DashboardApp({ userName, userEmail }: DashboardAppProps) {
  const [groups, setGroups] = useState<LineGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const handleSelectGroup = (id: string) => {
    setSelectedGroupId(id);
    setIsMobileSidebarOpen(false);
  };

  useEffect(() => {
    async function loadGroups() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getLineGroups();
        if (res.success && res.data) {
          setGroups(res.data);
          if (res.data.length > 0) {
            setSelectedGroupId(res.data[0].id);
          }
        } else {
          setError(res.error || "เกิดข้อผิดพลาดในการโหลดข้อมูลกลุ่มแชท");
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "เกิดข้อผิดพลาดที่ไม่คาดคิด"));
      } finally {
        setIsLoading(false);
      }
    }
    loadGroups();
  }, []);

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const handleToggleActionItem = async (groupId: string, itemId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const item = group.actionItems.find((i) => i.id === itemId);
    if (!item) return;

    const nextStatus = item.status === "completed" ? "pending" : "completed";

    setGroups((prevGroups) =>
      prevGroups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          actionItems: g.actionItems.map((i) => {
            if (i.id !== itemId) return i;
            return { ...i, status: nextStatus };
          }),
        };
      })
    );

    try {
      const res = await toggleActionItemDb(itemId, nextStatus);
      if (!res.success) {
        setGroups((prevGroups) =>
          prevGroups.map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              actionItems: g.actionItems.map((i) => {
                if (i.id !== itemId) return i;
                return { ...i, status: item.status };
              }),
            };
          })
        );
        toast.error("ไม่สามารถบันทึกสถานะลงฐานข้อมูลได้: " + res.error);
      }
    } catch (err: unknown) {
      setGroups((prevGroups) =>
        prevGroups.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            actionItems: g.actionItems.map((i) => {
              if (i.id !== itemId) return i;
              return { ...i, status: item.status };
            }),
          };
        })
      );
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: " + getErrorMessage(err, "ไม่ทราบสาเหตุ"));
    }
  };

  const handleSyncGroup = async (groupId: string) => {
    const groupToSync = groups.find((g) => g.id === groupId);
    if (!groupToSync) return;

    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          syncStatus: "syncing",
          syncError: undefined,
        };
      })
    );

    try {
      const res = await summarizeChat(groupId, groupToSync.rawChat);
      if (res && !res.success && res.error === "ไม่มีข้อความใหม่ที่ต้องการสรุปข้อมูลในขณะนี้") {
        toast.info("ไม่มีข้อความใหม่", {
          description: "ระบบได้ทำการสรุปข้อความชุดปัจจุบันเสร็จสิ้นแล้ว",
        });
      } else if (res && !res.success) {
        toast.error("ซิงค์ข้อมูลล้มเหลว", {
          description: res.error,
        });
      } else if (res && res.success) {
        toast.success("ซิงค์ข้อมูลสำเร็จ", {
          description: "บทสรุปและรายการงานได้รับการอัปเดตเรียบร้อยแล้ว",
        });
      }
      const fetchRes = await getLineGroups();
      if (fetchRes.success && fetchRes.data) {
        setGroups(fetchRes.data);
      }
    } catch (err: unknown) {
      console.error("Sync error:", err);
      toast.error("เกิดข้อผิดพลาดในการซิงค์ข้อมูล", {
        description: getErrorMessage(err, "ไม่ทราบสาเหตุ"),
      });
      const fetchRes = await getLineGroups();
      if (fetchRes.success && fetchRes.data) {
        setGroups(fetchRes.data);
      }
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", bgcolor: "#f6f8fb" }}>
        <Stack spacing={2} sx={{ alignItems: "center", color: "#52525b" }}>
          <CircularProgress size={42} thickness={4} sx={{ color: "#059669" }} />
          <Typography sx={{ fontSize: 14, fontWeight: 800 }}>กำลังเชื่อมต่อฐานข้อมูล</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", bgcolor: "#f6f8fb", p: 3 }}>
        <Paper elevation={0} sx={{ width: "100%", maxWidth: 480, p: 4, border: "1px solid #e4e4e7", borderRadius: 4, textAlign: "center" }}>
          <Avatar sx={{ width: 64, height: 64, mx: "auto", mb: 2, bgcolor: "#fff1f2", color: "#e11d48", border: "1px solid #ffe4e6" }}>
            <MessageSquare size={32} />
          </Avatar>
          <Typography component="h2" sx={{ fontSize: 20, fontWeight: 950, color: "#27272a" }}>
            เชื่อมต่อฐานข้อมูลล้มเหลว
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 14, lineHeight: 1.8, color: "#71717a", fontWeight: 600 }}>{error}</Typography>
          <Alert severity="info" sx={{ mt: 3, textAlign: "left", borderRadius: 3, bgcolor: "#fff", border: "1px solid #e4e4e7" }}>
            <Typography sx={{ mb: 0.5, fontSize: 13, fontWeight: 900 }}>คำแนะนำ:</Typography>
            <Box component="ol" sx={{ m: 0, pl: 2.5, fontSize: 12, lineHeight: 1.8 }}>
              <li>ตรวจสอบว่า MySQL Server รันอยู่จริง</li>
              <li>ตรวจสอบตัวแปร DATABASE_URL ในไฟล์ .env</li>
              <li>รันคำสั่ง npx prisma db push เพื่อจำลองตาราง</li>
            </Box>
          </Alert>
          <Button
            variant="contained"
          onClick={() => window.location.reload()}
            sx={{ mt: 3, borderRadius: 3, bgcolor: "#059669", fontWeight: 900, boxShadow: "0 12px 24px rgba(5,150,105,0.16)", "&:hover": { bgcolor: "#047857" } }}
        >
          ลองใหม่อีกครั้ง
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", bgcolor: "#fff", color: "#27272a" }}>
      {/* Mobile Drawer Navigation Sidebar */}
      <Drawer
        open={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": { width: 280, border: 0, bgcolor: "#0a0b0d" },
        }}
      >
        <Box sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          <h2>Navigation Drawer</h2>
          <p>Select a LINE group or configure status.</p>
        </Box>
          <LineGroupSidebar
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={handleSelectGroup}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
      </Drawer>

      {/* Desktop Sidebar (hidden on mobile) */}
      <Box sx={{ display: { xs: "none", lg: "flex" }, flexShrink: 0, height: "100%" }}>
        <LineGroupSidebar
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={handleSelectGroup}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </Box>

      <Box component="main" sx={{ display: "flex", flex: 1, minWidth: 0, height: "100%", flexDirection: "column", overflow: "hidden", bgcolor: "#f6f8fb" }}>
        <Box
          component="header"
          sx={{
            height: 64,
            flexShrink: 0,
            borderBottom: "1px solid rgba(228,228,231,0.85)",
            bgcolor: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(14px)",
            px: { xs: 2, sm: 3 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 30,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
            {/* Hamburger Button for Mobile */}
            <IconButton
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Toggle sidebar"
              sx={{ display: { xs: "inline-flex", lg: "none" }, ml: -1, color: "#71717a", borderRadius: 3, "&:hover": { bgcolor: "#f4f4f5", color: "#27272a" } }}
            >
              <Menu size={21} />
            </IconButton>

            {/* Breadcrumb path */}
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0, color: "#a1a1aa", userSelect: "none" }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>SaroopHai Portal</Typography>
              <Typography sx={{ color: "#e4e4e7" }}>/</Typography>
              {selectedGroupId === "system_status" ? (
                <Typography noWrap sx={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>สถานะและบันทึกระบบ</Typography>
              ) : activeGroup ? (
                <Typography noWrap sx={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>{activeGroup.name}</Typography>
              ) : (
                <Typography noWrap sx={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>แดชบอร์ด</Typography>
              )}
            </Stack>
          </Stack>

          {/* User Profile Info & Sign Out */}
          <Stack direction="row" spacing={2.5} sx={{ alignItems: "center" }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", userSelect: "none" }}>
              <Avatar sx={{ width: 28, height: 28, borderRadius: 2, bgcolor: "#059669", color: "#fff", fontSize: 12, fontWeight: 600 }}>
                {userName ? userName[0].toUpperCase() : "U"}
              </Avatar>
              <Box sx={{ display: { xs: "none", md: "block" }, minWidth: 0, textAlign: "left" }}>
                <Typography noWrap sx={{ maxWidth: 130, fontSize: 12.5, fontWeight: 600, color: "#18181b", lineHeight: 1.2 }}>
                  {userName || "Google User"}
                </Typography>
                <Typography noWrap sx={{ maxWidth: 130, mt: 0.25, fontSize: 10, fontWeight: 400, color: "#71717a", lineHeight: 1 }}>
                  {userEmail || "user@email.com"}
                </Typography>
              </Box>
            </Stack>
            <SignOutButton />
          </Stack>
        </Box>

        {selectedGroupId === "system_status" ? (
          <SystemStatusDashboard />
        ) : activeGroup ? (
          <SummaryDashboard
            group={activeGroup}
            onSync={handleSyncGroup}
            onToggleActionItem={handleToggleActionItem}
          />
        ) : (
          <Box sx={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "#a1a1aa", fontWeight: 800 }}>
            ไม่พบข้อมูลกลุ่มแชทในระบบ
          </Box>
        )}
      </Box>
    </Box>
  );
}

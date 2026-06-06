"use client";

import React, { useState } from "react";
import { LineGroup } from "../lib/MockData";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  Drawer,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Award,
  BarChart2,
  CheckCircle,
  Clock,
  Coffee,
  FileText,
  Hash,
  ListTodo,
  Moon,
  RefreshCw,
  Smile,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
  User,
  X,
  MessageSquare,
} from "lucide-react";

interface SummaryDashboardProps {
  group: LineGroup;
  onSync: (groupId: string) => void;
  onToggleActionItem: (groupId: string, itemId: string) => void;
}

type TabType = "summary" | "actions" | "topics";

function sentimentMeta(sentiment: string) {
  switch (sentiment) {
    case "Positive":
      return { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", text: "เชิงบวก (Positive)" };
    case "Neutral":
      return { color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd", text: "ทั่วไป (Neutral)" };
    case "Mixed":
      return { color: "#d97706", bg: "#fffbeb", border: "#fde68a", text: "ผสมผสาน (Mixed)" };
    case "Negative":
      return { color: "#e11d48", bg: "#fff1f2", border: "#fecdd3", text: "เชิงลบ (Negative)" };
    default:
      return { color: "#52525b", bg: "#f4f4f5", border: "#e4e4e7", text: "ไม่ระบุ" };
  }
}

function topicColor(category: string) {
  if (category === "urgent") return { color: "#e11d48", bg: "#fff1f2", border: "#fecdd3" };
  if (category === "finance") return { color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  if (category === "work") return { color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" };
  if (category === "social") return { color: "#9333ea", bg: "#faf5ff", border: "#e9d5ff" };
  return { color: "#52525b", bg: "#f4f4f5", border: "#e4e4e7" };
}

function getContributorMessages(rawChat: string, contributorName: string): { time: string; text: string }[] {
  if (!rawChat) return [];

  const lines = rawChat.split("\n");
  const messages: { time: string; text: string }[] = [];

  for (const line of lines) {
    const match = line.match(/^\[(\d{2}:\d{2})\]\s+([^:]+):\s+(.*)$/);
    if (match) {
      const [, time, sender, text] = match;
      if (sender.trim().toLowerCase() === contributorName.trim().toLowerCase()) {
        messages.push({ time, text: text.trim() });
      }
    }
  }
  return messages;
}

export function SummaryDashboard({
  group,
  onSync,
  onToggleActionItem,
}: SummaryDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null);
  const [seenTopicsCounts, setSeenTopicsCounts] = useState<Record<string, number>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on client-side mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("seen_topics_counts");
      if (saved) {
        setSeenTopicsCounts(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load seen topics counts:", e);
    }
    setIsHydrated(true);
  }, []);

  // Mark topics as seen when viewing the topics tab
  React.useEffect(() => {
    if (activeTab === "topics") {
      setSeenTopicsCounts((prev) => {
        if (prev[group.id] === group.topics.length) return prev;
        const next = {
          ...prev,
          [group.id]: group.topics.length,
        };
        try {
          localStorage.setItem("seen_topics_counts", JSON.stringify(next));
        } catch (e) {
          console.error("Failed to save seen topics counts:", e);
        }
        return next;
      });
    }
  }, [activeTab, group.id, group.topics.length]);

  const isSyncing = group.syncStatus === "syncing";
  const isIdle = group.syncStatus === "idle";
  const isFailed = group.syncStatus === "failed";
  const pendingActionsCount = group.actionItems.filter((item) => item.status === "pending").length;
  const completedActionsCount = group.actionItems.filter((item) => item.status === "completed").length;
  const totalActionsCount = group.actionItems.length;
  const completionPercent = totalActionsCount > 0 ? Math.round((completedActionsCount / totalActionsCount) * 100) : 0;
  const maxActivity = Math.max(...group.hourlyActivity, 1);
  const sentiment = sentimentMeta(group.stats.sentiment);

  const seenCount = seenTopicsCounts[group.id] ?? 0;
  const unreadTopicsCount = isHydrated ? Math.max(0, group.topics.length - seenCount) : 0;

  return (
    <Box sx={{ display: "flex", flex: 1, minHeight: 0, flexDirection: "column", overflow: "hidden", bgcolor: "#f6f8fb", color: "#27272a" }}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          px: { xs: 2.5, sm: 4 },
          py: 2.25,
          borderBottom: "1px solid rgba(228,228,231,0.86)",
          bgcolor: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(14px)",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
            <Typography component="h1" noWrap sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 600, color: "#09090b", letterSpacing: 0 }}>
              {group.name}
            </Typography>
            <Chip
              size="small"
              label={`ID: ${group.id}`}
              sx={{ height: 22, borderRadius: 999, bgcolor: "#f4f4f5", color: "#71717a", border: "1px solid #e4e4e7", fontSize: 10, fontWeight: 600 }}
            />
          </Stack>
          <Typography sx={{ mt: 0.75, fontSize: 12, fontWeight: 500, color: "#a1a1aa" }}>
            ซิงค์ล่าสุด: <Box component="span" sx={{ color: "#52525b", fontWeight: 600 }}>{group.lastSynced}</Box>
          </Typography>
        </Box>

        <Button
          onClick={() => onSync(group.id)}
          disabled={isSyncing}
          variant={isSyncing ? "outlined" : "contained"}
          startIcon={<RefreshCw size={17} className={isSyncing ? "app-spin" : ""} />}
          sx={{
            minHeight: 40,
            flexShrink: 0,
            borderRadius: 2.5,
            px: { xs: 1.75, sm: 2.5 },
            bgcolor: isSyncing ? undefined : "#059669",
            borderColor: "#e4e4e7",
            color: isSyncing ? "#71717a" : "#fff",
            fontWeight: 600,
            textTransform: "none",
            boxShadow: isSyncing ? "none" : "0 8px 16px rgba(5,150,105,0.16)",
            "&:hover": { bgcolor: isSyncing ? "#f4f4f5" : "#047857" },
          }}
        >
          {isSyncing ? "กำลังวิเคราะห์..." : "Sync & สรุปข้อมูล"}
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2.5, sm: 4 } }}>
        {isFailed ? (
          <StatePanel
            tone="error"
            title="การวิเคราะห์และสรุปผลผิดพลาด"
            message={group.syncError || "เกิดข้อผิดพลาดในการเชื่อมต่อหรือวิเคราะห์ข้อมูลจาก Gemini API"}
            actionLabel="ลองซิงค์ใหม่อีกครั้ง"
            onAction={() => onSync(group.id)}
          />
        ) : isIdle ? (
          <StatePanel
            tone="success"
            title="ยังไม่มีสรุปข้อมูลของวันนี้"
            message={`แชทของกลุ่ม "${group.name}" ยังไม่ได้รับการดึงข้อมูลและทำรายงานสรุปประจำวัน`}
            actionLabel="เริ่มต้นซิงค์ข้อมูลสรุปทันที"
            onAction={() => onSync(group.id)}
          />
        ) : (
          <Stack spacing={4}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                },
                gap: 3,
              }}
            >
              <KpiCard
                label="ข้อความวันนี้"
                value={String(group.stats.messagesToday)}
                icon={FileText}
                accent="#059669"
                footer={
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                    <Chip
                      size="small"
                      icon={group.stats.messagesChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      label={`${group.stats.messagesChange >= 0 ? "+" : ""}${group.stats.messagesChange}%`}
                      sx={{
                        height: 22,
                        bgcolor: group.stats.messagesChange >= 0 ? "#ecfdf5" : "#fff1f2",
                        color: group.stats.messagesChange >= 0 ? "#047857" : "#e11d48",
                        fontWeight: 600,
                      }}
                    />
                    <Typography noWrap sx={{ fontSize: 12, fontWeight: 500, color: "#a1a1aa" }}>เทียบกับเมื่อวาน</Typography>
                  </Stack>
                }
              />
              <KpiCard
                label="สมาชิกส่งแชท"
                value={`${group.stats.activeContributorsCount} / ${group.membersCount}`}
                icon={User}
                accent="#2563eb"
                footer={<Typography sx={{ fontSize: 12, fontWeight: 500, color: "#a1a1aa" }}>คน ที่พูดคุยกันภายในกลุ่มวันนี้</Typography>}
              />
              <KpiCard
                label="บรรยากาศการสนนทนา"
                value={sentiment.text}
                icon={Smile}
                accent={sentiment.color}
                footer={
                  <Box>
                    <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.75 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#71717a" }}>ดัชนีเชิงบวก</Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: sentiment.color }}>{group.stats.sentimentScore}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={group.stats.sentimentScore} sx={{ height: 6, borderRadius: 999, bgcolor: "#f4f4f5", "& .MuiLinearProgress-bar": { bgcolor: sentiment.color, borderRadius: 999 } }} />
                  </Box>
                }
              />
              <KpiCard
                label="งานค้างอยู่"
                value={String(pendingActionsCount)}
                icon={CheckCircle}
                accent="#d97706"
                footer={<Typography sx={{ fontSize: 12, fontWeight: 500, color: "#71717a" }}>ทำเสร็จ {completedActionsCount}/{totalActionsCount} งาน ({completionPercent}%)</Typography>}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2fr) minmax(320px, 1fr)" },
                gap: 4,
                alignItems: "start",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Paper elevation={0} sx={{ overflow: "hidden", border: "1px solid #e4e4e7", borderRadius: 4, bgcolor: "#fff" }}>
                  <Box sx={{ px: 2.5, py: 1.75, borderBottom: "1px solid #e4e4e7", bgcolor: "#fafafa" }}>
                    <Tabs
                      value={activeTab}
                      onChange={(_, value: TabType) => setActiveTab(value)}
                      variant="scrollable"
                      scrollButtons="auto"
                      aria-label="summary dashboard sections"
                      sx={{
                        minHeight: 40,
                        bgcolor: "#f4f4f5", // Segmented control background
                        borderRadius: 3,
                        p: 0.5,
                        display: "inline-flex",
                        "& .MuiTabs-flexContainer": { gap: 0.5 },
                        "& .MuiTabs-indicator": { display: "none" },
                        "& .MuiTab-root": {
                          minHeight: 32,
                          height: 34,
                          minWidth: { xs: 110, sm: 130 },
                          px: 2,
                          borderRadius: 2.25,
                          color: "#71717a",
                          textTransform: "none",
                          fontSize: 13,
                          fontWeight: 500,
                          transition: "all 160ms cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": { color: "#18181b" },
                        },
                        "& .Mui-selected": {
                          bgcolor: "#fff",
                          color: "#18181b !important",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.03)",
                          fontWeight: 600,
                        },
                      }}
                    >
                      <Tab value="summary" label={<DashboardTabLabel icon={FileText} label="สรุปตามเวลา" active={activeTab === "summary"} />} />
                      <Tab
                        value="actions"
                        label={<DashboardTabLabel icon={ListTodo} label="งานที่ต้องทำ" count={pendingActionsCount} active={activeTab === "actions"} />}
                      />
                      <Tab value="topics" label={<DashboardTabLabel icon={Hash} label="ประเด็นสำคัญ" count={unreadTopicsCount} active={activeTab === "topics"} />} />
                    </Tabs>
                  </Box>
                  <Box sx={{ p: { xs: 2.5, sm: 4 }, minHeight: 420 }}>
                    {activeTab === "summary" && <SummaryTab group={group} />}
                    {activeTab === "actions" && (
                      <ActionsTab
                        group={group}
                        pendingActionsCount={pendingActionsCount}
                        onToggleActionItem={onToggleActionItem}
                      />
                    )}
                    {activeTab === "topics" && <TopicsTab group={group} />}
                  </Box>
                </Paper>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Stack spacing={3}>
                  <ActivityCard hourlyActivity={group.hourlyActivity} maxActivity={maxActivity} />
                  <ContributorsCard
                    group={group}
                    onSelectContributor={setSelectedContributor}
                  />
                </Stack>
              </Box>
            </Box>
          </Stack>
        )}
      </Box>

      {/* Contributor Chat History Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedContributor)}
        onClose={() => setSelectedContributor(null)}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: 420 },
            bgcolor: "#f6f8fb",
            boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.05)",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
          {/* Header */}
          <Box
            sx={{
              p: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#fff",
              borderBottom: "1px solid #e4e4e7",
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "#eef2ff",
                  color: "#4f46e5",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {selectedContributor ? selectedContributor.charAt(0) : ""}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#18181b", lineHeight: 1.2 }}>
                  {selectedContributor}
                </Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#71717a", mt: 0.25 }}>
                  ประวัติการสนทนาของกลุ่ม
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setSelectedContributor(null)} size="small" sx={{ color: "#71717a", "&:hover": { color: "#18181b" } }}>
              <X size={18} />
            </IconButton>
          </Box>

          {/* Messages list */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
            <Stack spacing={2}>
              {selectedContributor && (() => {
                const msgs = getContributorMessages(group.rawChat, selectedContributor);
                if (msgs.length === 0) {
                  return (
                    <Stack spacing={1.5} sx={{ py: 8, alignItems: "center", textAlign: "center", color: "#a1a1aa" }}>
                      <MessageSquare size={36} color="#d4d4d8" />
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                        ไม่พบประวัติข้อความของ {selectedContributor} ในรอบการสรุปนี้
                      </Typography>
                    </Stack>
                  );
                }
                return msgs.map((msg, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      alignSelf: "flex-start",
                      maxWidth: "85%",
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.75,
                        bgcolor: "#fff",
                        border: "1px solid #e4e4e7",
                        borderRadius: "0 12px 12px 12px",
                        boxShadow: "0 2px 4px rgba(24,24,27,0.02)",
                      }}
                    >
                      <Typography sx={{ fontSize: 13.5, lineHeight: 1.6, fontWeight: 400, color: "#27272a", wordBreak: "break-word" }}>
                        {msg.text}
                      </Typography>
                    </Paper>
                    <Typography sx={{ fontSize: 10, fontWeight: 500, color: "#a1a1aa", mt: 0.5, pl: 0.5 }}>
                      {msg.time} น.
                    </Typography>
                  </Box>
                ));
              })()}
            </Stack>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}

interface DashboardTabLabelProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  count?: number;
  active: boolean;
  mutedCount?: boolean;
}

function DashboardTabLabel({
  icon: Icon,
  label,
  count,
  active,
  mutedCount = false,
}: DashboardTabLabelProps) {
  const showCount = typeof count === "number";

  return (
    <Stack direction="row" spacing={1} sx={{ width: "100%", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
      <Icon size={14} color={active ? "#18181b" : "#71717a"} />
      <Typography noWrap sx={{ fontSize: 13, fontWeight: active ? 600 : 500, lineHeight: 1.2 }}>
        {label}
      </Typography>
      {showCount && count > 0 && (
        <Box
          component="span"
          sx={{
            minWidth: 18,
            height: 18,
            px: 0.5,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            bgcolor: "#ef4444",
            color: "#ffffff",
            fontSize: 9.5,
            fontWeight: 700,
            lineHeight: 1,
            flexShrink: 0,
            boxShadow: active ? "0 0 0 2px #fff" : "0 0 0 2px #f4f4f5",
          }}
        >
          {count}
        </Box>
      )}
    </Stack>
  );
}

function StatePanel({
  tone,
  title,
  message,
  actionLabel,
  onAction,
}: {
  tone: "success" | "error";
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const isError = tone === "error";
  return (
    <Paper elevation={0} sx={{ maxWidth: 680, mx: "auto", mt: 4, p: { xs: 3, sm: 5 }, textAlign: "center", border: `1px solid ${isError ? "#fecdd3" : "#a7f3d0"}`, borderRadius: 5, bgcolor: isError ? "#fff1f2" : "#fff" }}>
      <Avatar sx={{ width: 64, height: 64, mx: "auto", mb: 2.5, borderRadius: 3, bgcolor: isError ? "#ffe4e6" : "#ecfdf5", color: isError ? "#e11d48" : "#059669" }}>
        <RefreshCw size={30} />
      </Avatar>
      <Typography component="h2" sx={{ fontSize: 20, fontWeight: 600, color: isError ? "#9f1239" : "#27272a" }}>{title}</Typography>
      <Typography sx={{ mt: 1.25, maxWidth: 480, mx: "auto", fontSize: 14, lineHeight: 1.8, fontWeight: 500, color: "#52525b" }}>{message}</Typography>
      {isError && (
        <Alert severity="info" sx={{ mt: 3, textAlign: "left", borderRadius: 3, bgcolor: "#fff", border: "1px solid #e4e4e7" }}>
          เปิดเมนูสถานะและบันทึกระบบ ตรวจสอบ API settings แล้วกลับมาซิงค์ข้อมูลใหม่อีกครั้ง
        </Alert>
      )}
      <Button variant="contained" onClick={onAction} sx={{ mt: 3, borderRadius: 2.5, bgcolor: "#059669", fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#047857" } }}>
        {actionLabel}
      </Button>
    </Paper>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  footer,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  accent: string;
  footer: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 2,
        border: "1px solid #e4e4e7",
        borderRadius: 2.5,
        bgcolor: "#fff",
        transition: "all 180ms ease",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 10px 20px rgba(24,24,27,0.04)",
          borderColor: "rgba(16,185,129,0.2)",
        },
      }}
    >
      <Box>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.8, color: "#71717a", textTransform: "uppercase" }}>
            {label}
          </Typography>
          <Avatar sx={{ width: 28, height: 28, borderRadius: 2, bgcolor: `${accent}12`, color: accent, border: `1px solid ${accent}18` }}>
            <Icon size={15} color={accent} />
          </Avatar>
        </Stack>
        <Typography sx={{ mt: 0.5, fontSize: 22, fontWeight: 600, color: "#09090b", letterSpacing: -0.5 }}>
          {value}
        </Typography>
      </Box>
      <Box sx={{ mt: 1 }}>
        {footer}
      </Box>
    </Paper>
  );
}

function SummaryTab({ group }: { group: LineGroup }) {
  return (
    <Stack spacing={4}>
      {/* Daily Overall Analysis Box */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: "1px solid rgba(16, 185, 129, 0.16)",
          borderLeft: "4px solid #10b981",
          borderRadius: 3,
          background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
          boxShadow: "0 10px 30px -10px rgba(16, 185, 129, 0.08)",
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 1.5 }}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: "rgba(16, 185, 129, 0.12)",
              color: "#10b981",
              borderRadius: 1.5,
            }}
          >
            <Sparkles size={14} />
          </Avatar>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.2,
              color: "#047857",
              textTransform: "uppercase",
            }}
          >
            บทวิเคราะห์ภาพรวมประจำวัน
          </Typography>
        </Stack>
        <Typography
          sx={{
            fontSize: 14.5,
            lineHeight: 1.85,
            fontWeight: 500,
            color: "#3f3f46",
          }}
        >
          {group.summary.overall}
        </Typography>
      </Paper>

      {/* Modern Connected Timeline List */}
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <TimelineItem
          icon={Coffee}
          color="#d97706"
          label="ช่วงเช้า"
          timeRange="08:00 - 12:00"
          text={group.summary.morning}
        />
        <TimelineItem
          icon={Sun}
          color="#0284c7"
          label="ช่วงบ่าย"
          timeRange="12:00 - 17:00"
          text={group.summary.afternoon}
        />
        <TimelineItem
          icon={Moon}
          color="#4f46e5"
          label="ช่วงเย็น/ค่ำ"
          timeRange="17:00 เป็นต้นไป"
          text={group.summary.evening}
          last
        />
      </Stack>
    </Stack>
  );
}

function renderFormattedBullets(text: string) {
  if (!text) return null;

  // Split by newlines or inline bullets
  let processedLines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // If it's a single line, check if it contains inline bullet markers like " - " or " • "
  if (processedLines.length === 1) {
    const singleLine = processedLines[0];
    if (singleLine.includes(" - ")) {
      processedLines = singleLine.split(/\s+-\s+/);
    } else if (singleLine.includes(" • ")) {
      processedLines = singleLine.split(/\s+•\s+/);
    }
  }

  const hasBullets = processedLines.some(
    (line) =>
      line.startsWith("-") ||
      line.startsWith("*") ||
      line.startsWith("•") ||
      /^\d+\./.test(line)
  );

  if (hasBullets || processedLines.length > 1) {
    return (
      <Box
        component="ul"
        sx={{
          m: 0,
          pl: 2.25,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
        }}
      >
        {processedLines.map((line, idx) => {
          const cleanLine = line
            .replace(/^[\-\*\•\s\u2022]+/, "")
            .replace(/^\d+\.\s+/, "")
            .trim();
          if (!cleanLine) return null;
          return (
            <Typography
              key={idx}
              component="li"
              sx={{
                fontSize: 13.5,
                lineHeight: 1.75,
                fontWeight: 400,
                color: "#52525b",
                "&::marker": {
                  color: "#d1d1d6",
                },
              }}
            >
              {cleanLine}
            </Typography>
          );
        })}
      </Box>
    );
  }

  return (
    <Typography
      sx={{
        fontSize: 13.5,
        lineHeight: 1.75,
        fontWeight: 400,
        color: "#52525b",
      }}
    >
      {text}
    </Typography>
  );
}

function TimelineItem({
  icon: Icon,
  color,
  label,
  timeRange,
  text,
  last = false,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  label: string;
  timeRange: string;
  text: string;
  last?: boolean;
}) {
  return (
    <Stack direction="row" spacing={3} sx={{ position: "relative" }}>
      {/* Left Column (Timeline graphics) */}
      <Stack sx={{ alignItems: "center", width: 24, flexShrink: 0, position: "relative" }}>
        {/* Bullet circle */}
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            bgcolor: color,
            border: "3px solid #fff",
            boxShadow: `0 0 0 2px ${color}22`,
            zIndex: 2,
            mt: 2.25, // Align with center of the card avatar
          }}
        />
        {/* Connector line */}
        {!last && (
          <Box
            sx={{
              position: "absolute",
              width: 2,
              top: 32,
              bottom: -40, // bridges the Stack spacing={5} gap (40px)
              left: 11,
              bgcolor: "#e4e4e7",
              zIndex: 1,
            }}
          />
        )}
      </Stack>

      {/* Right Column (Card content) */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          p: 2.5,
          border: "1px solid rgba(228, 228, 231, 0.8)",
          borderRadius: 3,
          bgcolor: "#fff",
          transition: "all 220ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            borderColor: color,
            boxShadow: `0 12px 28px -8px ${color}16`,
            transform: "translateY(-2px)",
          },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: `${color}14`,
              color: color,
              border: `1px solid ${color}26`,
              borderRadius: 2,
            }}
          >
            <Icon size={14} color={color} />
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#27272a", lineHeight: 1.2 }}>
              {label}
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 10, fontWeight: 500, color: "#a1a1aa" }}>
              {timeRange}
            </Typography>
          </Box>
        </Stack>
        {renderFormattedBullets(text)}
      </Paper>
    </Stack>
  );
}

function ActionsTab({
  group,
  pendingActionsCount,
  onToggleActionItem,
}: {
  group: LineGroup;
  pendingActionsCount: number;
  onToggleActionItem: (groupId: string, itemId: string) => void;
}) {
  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", gap: 1.5, pb: 1.5, borderBottom: "1px solid #e4e4e7" }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.8 }}>ทำเครื่องหมายหน้างานเมื่อทำงานเสร็จสิ้น</Typography>
        <Chip size="small" label={`งานที่ค้าง: ${pendingActionsCount}`} sx={{ alignSelf: { xs: "flex-start", sm: "center" }, bgcolor: "#f4f4f5", fontWeight: 600 }} />
      </Stack>

      <Stack spacing={1.5} sx={{ maxHeight: 390, overflowY: "auto", pr: 0.5 }}>
        {group.actionItems.map((item) => {
          const completed = item.status === "completed";
          return (
            <Paper key={item.id} elevation={0} sx={{ p: 2, border: "1px solid #e4e4e7", borderRadius: 2.5, bgcolor: completed ? "#fafafa" : "#fff", opacity: completed ? 0.68 : 1 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                <Checkbox checked={completed} onChange={() => onToggleActionItem(group.id, item.id)} sx={{ p: 0.25, color: "#d4d4d8", "&.Mui-checked": { color: "#059669" } }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 14, lineHeight: 1.75, fontWeight: 500, color: completed ? "#a1a1aa" : "#27272a", textDecoration: completed ? "line-through" : "none" }}>{item.task}</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1, mt: 1.5 }}>
                    <Chip size="small" icon={<User size={12} />} label={`ผู้รับผิดชอบ: ${item.assignee}`} sx={{ bgcolor: "#f4f4f5", fontWeight: 500, fontSize: 11 }} />
                    {item.dueDate && <Chip size="small" icon={<Clock size={12} />} label={`กำหนดส่ง: ${item.dueDate}`} sx={{ bgcolor: "#fafafa", fontWeight: 500, fontSize: 11 }} />}
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          );
        })}

        {group.actionItems.length === 0 && <EmptyState icon={ListTodo} text="ไม่พบงานมอบหมายจากการวิเคราะห์กลุ่มแชทนี้" />}
      </Stack>
    </Stack>
  );
}

function TopicsTab({ group }: { group: LineGroup }) {
  if (group.topics.length === 0) {
    return <EmptyState icon={Hash} text="ไม่พบหัวข้อหลักจากการวิเคราะห์กลุ่มแชทนี้" />;
  }

  return (
    <Stack spacing={2}>
      {group.topics.map((topic, index) => {
        const color = topicColor(topic.category);
        return (
          <Paper key={`${topic.name}-${index}`} elevation={0} sx={{ p: 2.5, border: "1px solid #e4e4e7", borderRadius: 3, bgcolor: "#fff" }}>
            <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", gap: 1.5 }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
                <Avatar sx={{ width: 28, height: 28, borderRadius: 2, bgcolor: "#f4f4f5", color: "#71717a", fontSize: 12, fontWeight: 600 }}>#{index + 1}</Avatar>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#27272a" }}>{topic.name}</Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Chip size="small" label={topic.category} sx={{ bgcolor: color.bg, color: color.color, border: `1px solid ${color.border}`, fontWeight: 600, textTransform: "uppercase", fontSize: 10 }} />
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#71717a" }}>ความสำคัญ: {topic.relevance}%</Typography>
              </Stack>
            </Stack>
            <LinearProgress variant="determinate" value={topic.relevance} sx={{ mt: 2, height: 6, borderRadius: 999, bgcolor: "#f4f4f5", "& .MuiLinearProgress-bar": { bgcolor: color.color, borderRadius: 999 } }} />
            <Stack component="ul" spacing={1.25} sx={{ mt: 2, mb: 0, pl: 0, listStyle: "none" }}>
              {topic.keyPoints.map((point, pointIndex) => (
                <Stack key={pointIndex} component="li" direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                  <Box sx={{ mt: "9px", width: 5, height: 5, borderRadius: "50%", bgcolor: "#10b981", flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 14, lineHeight: 1.75, fontWeight: 400, color: "#52525b" }}>{point}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}

function ActivityCard({ hourlyActivity, maxActivity }: { hourlyActivity: number[]; maxActivity: number }) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid #e4e4e7", borderRadius: 4, bgcolor: "#fff" }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
        <BarChart2 size={16} color="#059669" />
        <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "#a1a1aa", textTransform: "uppercase" }}>ปริมาณแชทใน 24 ชม.</Typography>
      </Stack>
      <Stack direction="row" spacing={0.5} sx={{ height: 140, alignItems: "flex-end", borderBottom: "1px solid #e4e4e7", pb: 1 }}>
        {hourlyActivity.map((value, index) => (
          <Box key={index} title={`${index}:00 - ${value} ข้อความ`} sx={{ flex: 1, height: `${Math.max((value / maxActivity) * 100, 4)}%`, borderRadius: "3px 3px 0 0", bgcolor: "#10b981", transition: "all 160ms ease", "&:hover": { bgcolor: "#059669", transform: "scaleX(1.2)" } }} />
        ))}
      </Stack>
      <Stack direction="row" sx={{ mt: 1, justifyContent: "space-between", color: "#a1a1aa" }}>
        {["00:00", "06:00", "12:00", "18:00", "23:00"].map((label) => (
          <Typography key={label} sx={{ fontSize: 9, fontWeight: 500 }}>{label}</Typography>
        ))}
      </Stack>
    </Paper>
  );
}

function ContributorsCard({
  group,
  onSelectContributor,
}: {
  group: LineGroup;
  onSelectContributor: (name: string) => void;
}) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid #e4e4e7", borderRadius: 4, bgcolor: "#fff" }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
        <Award size={16} color="#059669" />
        <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "#a1a1aa", textTransform: "uppercase" }}>สมาชิกคุยเยอะสูงสุด</Typography>
      </Stack>
      <Stack spacing={1.25}>
        {group.contributors.map((contributor, index) => (
          <Paper
            key={`${contributor.name}-${index}`}
            elevation={0}
            onClick={() => onSelectContributor(contributor.name)}
            sx={{
              p: 1.5,
              border: "1px solid #f4f4f5",
              borderRadius: 2.5,
              bgcolor: "#fff",
              cursor: "pointer",
              transition: "all 150ms ease",
              "&:hover": {
                borderColor: "rgba(16, 185, 129, 0.24)",
                bgcolor: "#f0fdf4",
                transform: "translateY(-1px)",
              },
            }}
          >
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
                <Avatar sx={{ width: 26, height: 26, borderRadius: 2, bgcolor: index === 0 ? "#fef3c7" : "#f4f4f5", color: index === 0 ? "#92400e" : "#71717a", fontSize: 11, fontWeight: 600 }}>{index + 1}</Avatar>
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 500, color: "#27272a" }}>{contributor.name}</Typography>
              </Stack>
              <Chip size="small" label={`${contributor.messagesCount} แชท`} sx={{ bgcolor: "#f4f4f5", fontWeight: 500, fontSize: 11 }} />
            </Stack>
          </Paper>
        ))}
        {group.contributors.length === 0 && <Typography sx={{ py: 3, textAlign: "center", fontSize: 12, fontWeight: 500, color: "#a1a1aa" }}>ยังไม่มีข้อมูลวิเคราะห์บุคคล</Typography>}
      </Stack>
    </Paper>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ size?: number; color?: string }>; text: string }) {
  return (
    <Stack spacing={1.25} sx={{ py: 8, alignItems: "center", color: "#a1a1aa" }}>
      <Icon size={34} color="#d4d4d8" />
      <Typography sx={{ fontSize: 13.5, fontWeight: 500 }}>{text}</Typography>
    </Stack>
  );
}

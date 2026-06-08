"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LineGroup, Topic } from "../lib/MockData";
import { getSummaryHistoryDates, getSummaryByDate } from "@/app/actions/groups";
import { toast } from "sonner";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
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
  Edit2,
  Trash2,
  Plus,
  Calendar,
  History,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";

interface SummaryDashboardProps {
  group: LineGroup;
  onSync: (groupId: string) => void;
  onToggleActionItem: (groupId: string, itemId: string) => void;
  onCreateActionItem: (groupId: string, data: { task: string; assignee: string; dueDate?: string }) => Promise<void>;
  onUpdateActionItem: (itemId: string, data: { task: string; assignee: string; dueDate?: string }) => Promise<void>;
  onDeleteActionItem: (groupId: string, itemId: string) => Promise<void>;
  onCreateTopic: (groupId: string, data: { name: string; category: string; relevance: number; keyPoints: string[] }) => Promise<void>;
  onUpdateTopic: (topicId: number, data: { name: string; category: string; relevance: number; keyPoints: string[] }) => Promise<void>;
  onDeleteTopic: (groupId: string, topicId: number) => Promise<void>;
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
  onCreateActionItem,
  onUpdateActionItem,
  onDeleteActionItem,
  onCreateTopic,
  onUpdateTopic,
  onDeleteTopic,
}: SummaryDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null);
  const [seenTopicsCounts, setSeenTopicsCounts] = useState<Record<string, number>>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ── History date filter ──────────────────────────────────────────
  type HistoryDate = { dateStr: string; label: string };
  type HistoryData = {
    summaryDate: string;
    summary: { overall: string; morning: string; afternoon: string; evening: string };
    stats: { messagesToday: number; activeContributorsCount: number; sentiment: string; sentimentScore: number };
    topics: { name: string; category: string; relevance: number; keyPoints: string[] }[];
    actionItems: { task: string; assignee: string; status?: string; assignedDate?: string; dueDate?: string }[];
  };

  const [historyDates, setHistoryDates] = useState<HistoryDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("today");
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const isHistoryMode = selectedDate !== "today";

  // Load available history dates whenever group changes
  useEffect(() => {
    getSummaryHistoryDates(group.id).then((res) => {
      if (res.success && res.data) setHistoryDates(res.data as HistoryDate[]);
    });
  }, [group.id]);

  // Reset to today when group changes
  useEffect(() => {
    setSelectedDate("today");
    setHistoryData(null);
  }, [group.id]);

  // Fetch historical data when a past date is selected
  const handleSelectDate = useCallback(async (dateStr: string) => {
    setDateMenuOpen(false);
    setIsTransitioning(true);
    const reset = () => setIsTransitioning(false);
    if (dateStr === "today") {
      setSelectedDate("today");
      setHistoryData(null);
      setTimeout(reset, 300);
      return;
    }
    setSelectedDate(dateStr);
    setHistoryLoading(true);
    try {
      const res = await getSummaryByDate(group.id, dateStr);
      if (res.success && res.data) {
        setHistoryData(res.data as unknown as HistoryData);
      } else {
        toast.error("ไม่พบข้อมูลย้อนหลังของวันที่เลือก");
        setSelectedDate("today");
        setHistoryData(null);
      }
    } finally {
      setHistoryLoading(false);
      setTimeout(reset, 300);
    }
  }, [group.id]);

  // Effective data: history snapshot or live group
  const effectiveSummary = isHistoryMode && historyData ? historyData.summary : group.summary;
  const effectiveStats = isHistoryMode && historyData ? historyData.stats : group.stats;
  const effectiveTopics = isHistoryMode && historyData ? historyData.topics : group.topics;
  const selectedDateLabel = historyDates.find(d => d.dateStr === selectedDate)?.label || selectedDate;

  // Close date menu on outside click
  useEffect(() => {
    if (!dateMenuOpen) return;
    const handler = () => setDateMenuOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dateMenuOpen]);

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
  const effectiveActionItems = isHistoryMode && historyData ? historyData.actionItems : group.actionItems;
  const pendingActionsCount = effectiveActionItems.filter((item) => item.status !== "completed").length;
  const completedActionsCount = effectiveActionItems.filter((item) => item.status === "completed").length;
  const totalActionsCount = effectiveActionItems.length;
  const completionPercent = totalActionsCount > 0 ? Math.round((completedActionsCount / totalActionsCount) * 100) : 0;
  const maxActivity = Math.max(...group.hourlyActivity, 1);
  const sentiment = sentimentMeta(effectiveStats.sentiment);

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

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ alignItems: { xs: "stretch", sm: "center" }, flexShrink: 0 }}>
          {/* DatePicker filter */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="เลือกวันที่"
              format="DD/MM/YYYY"
              value={selectedDate === "today" ? null : dayjs(selectedDate)}
              onChange={(newVal: Dayjs | null) => {
                if (!newVal || !newVal.isValid()) {
                  handleSelectDate("today");
                } else {
                  handleSelectDate(newVal.format("YYYY-MM-DD"));
                }
              }}
              shouldDisableDate={(date: Dayjs) => {
                const dateStr = date.format("YYYY-MM-DD");
                const today = dayjs().format("YYYY-MM-DD");
                return dateStr !== today && !historyDates.some((d) => d.dateStr === dateStr);
              }}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    opacity: 1,
                    bgcolor: "#fff",
                    "& .MuiInputBase-root": { opacity: 1, bgcolor: "#fff" },
                    "& .MuiInputLabel-root": { opacity: 1 },
                    "& .MuiSvgIcon-root": { opacity: 1 },
                  },
                  slotProps: {
                    input: {
                      sx: {
                        opacity: 1,
                        height: 40,
                        borderRadius: 2.5,
                        fontSize: 13,
                        fontWeight: 600,
                        color: isHistoryMode ? "#7c3aed" : "#52525b",
                        bgcolor: isHistoryMode ? "#f5f3ff" : "#fff",
                        "&.Mui-disabled": { opacity: 1 },
                        "& fieldset": {
                          borderColor: isHistoryMode ? "#7c3aed" : "#e4e4e7",
                        },
                        "&:hover fieldset": { borderColor: "#7c3aed" },
                        "&.Mui-focused fieldset": { borderColor: "#7c3aed", borderWidth: 1 },
                      },
                    },
                    inputLabel: {
                      sx: { opacity: 1, fontSize: 13, color: isHistoryMode ? "#7c3aed" : undefined },
                    },
                  },
                },
                desktopPaper: {
                  elevation: 8,
                  sx: {
                    opacity: 1,
                    bgcolor: "#fff",
                    backgroundImage: "none",
                    "& .MuiPickersLayout-root": { opacity: 1, bgcolor: "#fff" },
                    "& .MuiPickersDay-root": { opacity: 1 },
                    "& .Mui-disabled": { opacity: 1, color: "#d4d4d8" },
                  },
                },
                mobilePaper: {
                  sx: {
                    opacity: 1,
                    bgcolor: "#fff",
                    backgroundImage: "none",
                    "& .MuiPickersLayout-root": { opacity: 1, bgcolor: "#fff" },
                    "& .MuiPickersDay-root": { opacity: 1 },
                    "& .Mui-disabled": { opacity: 1, color: "#d4d4d8" },
                  },
                },
                popper: {
                  sx: {
                    opacity: 1,
                    "& .MuiPaper-root": {
                      opacity: 1,
                      bgcolor: "#fff",
                      backgroundImage: "none",
                    },
                  },
                },
                actionBar: { actions: [] },
              }}
              sx={{ minWidth: 180 }}
            />
          </LocalizationProvider>

          {/* Sync button — hidden when viewing history */}
          {!isHistoryMode && (
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
          )}

          {/* Back to today button — shown in history mode */}
          {isHistoryMode && (
            <Button
              onClick={() => handleSelectDate("today")}
              variant="contained"
              startIcon={<ArrowLeft size={15} />}
              sx={{
                height: 40, borderRadius: 2.5, px: 2,
                bgcolor: "#7c3aed", color: "#fff", fontWeight: 600, fontSize: 13,
                textTransform: "none", boxShadow: "none",
                "&:hover": { bgcolor: "#6d28d9" },
              }}
            >
              กลับวันนี้
            </Button>
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: { xs: 2.5, sm: 4 },
          opacity: isTransitioning ? 0.35 : 1,
          transform: isTransitioning ? "translateY(6px)" : "translateY(0)",
          transition: "opacity 280ms cubic-bezier(0.4, 0, 0.2, 1), transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
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
            {/* History mode loading overlay */}
            {historyLoading && (
              <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: "#7c3aed" }}>
                <Box sx={{ width: 32, height: 32, border: "3px solid #ede9fe", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#7c3aed" }}>กำลังโหลดข้อมูลย้อนหลัง...</Typography>
              </Box>
            )}

            {/* History mode banner */}
            {isHistoryMode && !historyLoading && historyData && (
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #ddd6fe", bgcolor: "#f5f3ff", display: "flex", alignItems: "center", gap: 1.5 }}>
                <History size={16} color="#7c3aed" />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#6d28d9" }}>
                    กำลังดูข้อมูลย้อนหลัง — {selectedDateLabel}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: "#8b5cf6", mt: 0.25 }}>
                    ข้อมูลนี้เป็น snapshot ณ วันที่เลือก ไม่สามารถแก้ไขได้
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => handleSelectDate("today")}
                  sx={{ fontSize: 12, fontWeight: 600, color: "#7c3aed", textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#ede9fe" } }}
                >
                  กลับวันนี้
                </Button>
              </Paper>
            )}
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
                value={String(effectiveStats.messagesToday)}
                icon={FileText}
                accent="#059669"
                footer={
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                    {isHistoryMode ? (
                      <Typography noWrap sx={{ fontSize: 12, fontWeight: 500, color: "#a1a1aa" }}>ข้อมูลจาก snapshot วันที่เลือก</Typography>
                    ) : (
                      <>
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
                      </>
                    )}
                  </Stack>
                }
              />
              <KpiCard
                label="สมาชิกส่งแชท"
                value={`${effectiveStats.activeContributorsCount} / ${isHistoryMode ? "?" : group.membersCount}`}
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
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: sentiment.color }}>{effectiveStats.sentimentScore}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={effectiveStats.sentimentScore} sx={{ height: 6, borderRadius: 999, bgcolor: "#f4f4f5", "& .MuiLinearProgress-bar": { bgcolor: sentiment.color, borderRadius: 999 } }} />
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
                      onChange={(_, value: TabType) => {
                        if (value === activeTab) return;
                        setActiveTab(value);
                      }}
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
                  <Box
                    key={activeTab}
                    sx={{
                      p: { xs: 2.5, sm: 4 },
                      minHeight: 420,
                      animation: "tab-enter 240ms cubic-bezier(0.22, 0.61, 0.36, 1)",
                      "@keyframes tab-enter": {
                        "0%": {
                          opacity: 0,
                          transform: "translateY(12px) scale(0.985)",
                        },
                        "100%": {
                          opacity: 1,
                          transform: "translateY(0) scale(1)",
                        },
                      },
                    }}
                  >
                    {activeTab === "summary" && <SummaryTab summary={effectiveSummary} />}
                    {activeTab === "actions" && !isHistoryMode && (
                      <ActionsTab
                        group={group}
                        pendingActionsCount={pendingActionsCount}
                        onToggleActionItem={onToggleActionItem}
                        onCreateActionItem={onCreateActionItem}
                        onUpdateActionItem={onUpdateActionItem}
                        onDeleteActionItem={onDeleteActionItem}
                      />
                    )}
                    {activeTab === "topics" && !isHistoryMode && (
                      <TopicsTab
                        group={group}
                        onCreateTopic={onCreateTopic}
                        onUpdateTopic={onUpdateTopic}
                        onDeleteTopic={onDeleteTopic}
                      />
                    )}
                    {activeTab === "actions" && isHistoryMode && historyData && (
                      <HistoryActionsPanel items={historyData.actionItems} />
                    )}
                    {activeTab === "topics" && isHistoryMode && historyData && (
                      <HistoryTopicsPanel topics={historyData.topics as {name:string;category:string;relevance:number;keyPoints:string[]}[]} />
                    )}
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

function SummaryTab({ summary }: { summary: { overall: string; morning: string; afternoon: string; evening: string } }) {
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
          {summary.overall}
        </Typography>
      </Paper>

      {/* Modern Connected Timeline List */}
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <TimelineItem
          icon={Coffee}
          color="#d97706"
          label="ช่วงเช้า"
          timeRange="08:00 - 12:00"
          text={summary.morning}
        />
        <TimelineItem
          icon={Sun}
          color="#0284c7"
          label="ช่วงบ่าย"
          timeRange="12:00 - 17:00"
          text={summary.afternoon}
        />
        <TimelineItem
          icon={Moon}
          color="#4f46e5"
          label="ช่วงเย็น/ค่ำ"
          timeRange="17:00 เป็นต้นไป"
          text={summary.evening}
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

function getInitials(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function getAvatarColor(name: string) {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    "#0071e3", // Apple Blue
    "#34c759", // Apple Green
    "#ff9500", // Apple Orange
    "#ff3b30", // Apple Red
    "#af52de", // Apple Purple
    "#5856d6", // Indigo
    "#ff2d55", // Pink
    "#5ac8fa", // Sky Blue
  ];
  return colors[hash % colors.length];
}

function formatThaiDateTime(dateVal: Dayjs | null, timeVal: Dayjs | null): string {
  if (!dateVal) return "";
  const thMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.ม."];
  // Wait, let's fix thMonths elements to match exact spelling "มิ.ย."
  const thMonthsCorrect = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const day = dateVal.date();
  const month = thMonthsCorrect[dateVal.month()];
  const year = dateVal.year() + 543; // Buddhist Era
  
  let result = `${day} ${month} ${year}`;
  if (timeVal) {
    result += `, ${timeVal.format("HH:mm")}`;
  }
  return result;
}

function parseThaiDateTime(str: string | undefined): { date: Dayjs | null; time: Dayjs | null } {
  if (!str) return { date: null, time: null };
  try {
    const parts = str.split(",");
    const datePart = parts[0].trim();
    const timePart = parts[1] ? parts[1].trim() : null;

    let parsedDate: Dayjs | null = null;
    let parsedTime: Dayjs | null = null;

    if (datePart === "วันนี้") {
      parsedDate = dayjs();
    } else if (datePart === "พรุ่งนี้") {
      parsedDate = dayjs().add(1, "day");
    } else if (datePart === "เมื่อวาน" || datePart === "เมื่อวานนี้") {
      parsedDate = dayjs().subtract(1, "day");
    } else {
      const thMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      const match = datePart.match(/^(\d+)\s+([^\s]+)\s+(\d+)$/);
      if (match) {
        const day = parseInt(match[1], 10);
        const monthIndex = thMonths.indexOf(match[2]);
        const yearBE = parseInt(match[3], 10);
        const yearCE = yearBE - 543;
        if (monthIndex !== -1) {
          parsedDate = dayjs(new Date(yearCE, monthIndex, day));
        }
      }
    }

    if (timePart) {
      const timeMatch = timePart.match(/^(\d{2}):(\d{2})/);
      if (timeMatch) {
        const hrs = parseInt(timeMatch[1], 10);
        const mins = parseInt(timeMatch[2], 10);
        parsedTime = dayjs().hour(hrs).minute(mins);
      }
    }

    if (!parsedDate && datePart) {
      const d = dayjs(datePart);
      if (d.isValid()) parsedDate = d;
    }

    return { date: parsedDate, time: parsedTime };
  } catch (e) {
    console.error("Failed to parse Thai date time", e);
    return { date: null, time: null };
  }
}

interface TaskDialogProps {
  open: boolean;
  title: string;
  contributors: { name: string; messagesCount: number; avatarColor?: string; profileImageUrl?: string }[];
  initialValues?: { task: string; assignee: string; dueDate?: string };
  onClose: () => void;
  onSave: (data: { task: string; assignee: string; dueDate?: string }) => void;
}

function TaskDialog({ open, title, contributors, initialValues, onClose, onSave }: TaskDialogProps) {
  const [task, setTask] = useState("");
  const [assigneesList, setAssigneesList] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<Dayjs | null>(null);

  React.useEffect(() => {
    if (open) {
      setTask(initialValues?.task || "");
      setAssigneesList(
        initialValues?.assignee
          ? initialValues.assignee.split(",").map(n => n.trim()).filter(Boolean)
          : []
      );
      const { date, time } = parseThaiDateTime(initialValues?.dueDate);
      setSelectedDate(date);
      setSelectedTime(time);
    }
  }, [open, initialValues]);

  const handleSave = () => {
    if (!task.trim()) {
      toast.error("กรุณากรอกหัวข้องาน");
      return;
    }
    if (assigneesList.length === 0) {
      toast.error("กรุณาเลือกผู้รับผิดชอบ");
      return;
    }
    
    const assigneeStr = assigneesList.join(", ");
    const formattedDueDate = formatThaiDateTime(selectedDate, selectedTime);
    
    onSave({ 
      task: task.trim(), 
      assignee: assigneeStr, 
      dueDate: formattedDueDate || undefined 
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth 
      slotProps={{ 
        paper: { 
          sx: { 
            borderRadius: 4, 
            p: 1.5,
            bgcolor: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
          } 
        } 
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1, color: "#1d1d1f" }}>
        {title}
      </DialogTitle>
      
      <DialogContent sx={{ pb: 2 }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {/* Task Field (Textarea) */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", mb: 0.75 }}>
              หัวข้องานที่ต้องทำ <Box component="span" sx={{ color: "#ff3b30" }}>*</Box>
            </Typography>
            <TextField
              autoFocus
              fullWidth
              multiline
              rows={3}
              placeholder="ระบุรายละเอียดงานหรือสิ่งที่ต้องทำ..."
              value={task}
              onChange={(e) => setTask(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  bgcolor: "rgba(255,255,255,0.72)",
                  color: "#1d1d1f",
                  fontSize: 13,
                  fontWeight: 500,
                  p: 1.5,
                  "& fieldset": { borderColor: "rgba(0,0,0,0.08)" },
                  "&:hover fieldset": { borderColor: "rgba(0,0,0,0.15)" },
                  "&.Mui-focused fieldset": { borderColor: "#0071e3", borderWidth: 1 },
                },
              }}
            />
          </Box>

          {/* Assignees Field (Autocomplete Multi-tag with Avatar) */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", mb: 0.75 }}>
              ผู้รับผิดชอบ <Box component="span" sx={{ color: "#ff3b30" }}>*</Box>
            </Typography>
            <Autocomplete
              multiple
              freeSolo
              options={contributors.map(c => c.name)}
              value={assigneesList}
              onChange={(_, newValue) => setAssigneesList(newValue)}
              slotProps={{
                paper: {
                  sx: {
                    bgcolor: "#ffffff",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(0,0,0,0.08)"
                  }
                }
              }}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props;
                const matched = contributors.find(c => c.name.toLowerCase() === option.toLowerCase());
                const avatarSrc = matched?.profileImageUrl || undefined;
                const bgColor = matched?.avatarColor || getAvatarColor(option);
                
                return (
                  <Box 
                    component="li" 
                    key={key} 
                    {...optionProps} 
                    sx={{ 
                      gap: 1.5, 
                      p: "8px 16px !important", 
                      fontSize: 13, 
                      display: "flex", 
                      alignItems: "center" 
                    }}
                  >
                    <Avatar 
                      src={avatarSrc}
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: 1.5,
                        bgcolor: avatarSrc ? "transparent" : bgColor, 
                        color: "#fff", 
                        fontSize: 9, 
                        fontWeight: 700 
                      }}
                    >
                      {!avatarSrc && getInitials(option)}
                    </Avatar>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{option}</Typography>
                  </Box>
                );
              }}
              renderValue={(value: string[], getItemProps) =>
                value.map((option: string, index: number) => {
                  const { key, ...tagProps } = getItemProps({ index });
                  const matched = contributors.find(c => c.name.toLowerCase() === option.toLowerCase());
                  const avatarSrc = matched?.profileImageUrl || undefined;
                  const bgColor = matched?.avatarColor || getAvatarColor(option);
                  
                  return (
                    <Chip
                      key={key}
                      variant="outlined"
                      label={option}
                      avatar={
                        <Avatar 
                          src={avatarSrc}
                          sx={{ 
                            bgcolor: avatarSrc ? "transparent" : bgColor, 
                            color: "#fff", 
                            fontSize: 9, 
                            fontWeight: 700 
                          }}
                        >
                          {!avatarSrc && getInitials(option)}
                        </Avatar>
                      }
                      {...tagProps}
                      sx={{ borderRadius: 1.5, height: 26, fontSize: 12 }}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="เลือกหรือพิมพ์ชื่อผู้รับผิดชอบ..."
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      bgcolor: "rgba(255,255,255,0.72)",
                      color: "#1d1d1f",
                      fontSize: 13,
                      fontWeight: 500,
                      p: "4px 8px !important",
                      "& fieldset": { borderColor: "rgba(0,0,0,0.08)" },
                      "&:hover fieldset": { borderColor: "rgba(0,0,0,0.15)" },
                      "&.Mui-focused fieldset": { borderColor: "#0071e3", borderWidth: 1 },
                    },
                  }}
                />
              )}
            />
          </Box>

          {/* Date Picker + Time Picker side by side */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6e6e73" }}>
                    วันที่กำหนดส่ง (ไม่บังคับ)
                  </Typography>
                  {selectedDate && (
                    <Button
                      onClick={() => setSelectedDate(null)}
                      sx={{
                        p: 0,
                        minWidth: 0,
                        height: "auto",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#ff3b30",
                        textTransform: "none",
                        "&:hover": { bgcolor: "transparent", color: "#d9261c" }
                      }}
                    >
                      ล้างค่า
                    </Button>
                  )}
                </Stack>
                <DatePicker
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  slotProps={{
                    popper: {
                      sx: {
                        "& .MuiPaper-root": {
                          bgcolor: "#ffffff !important",
                          boxShadow: "0 10px 40px rgba(0,0,0,0.12) !important",
                          border: "1px solid rgba(0,0,0,0.08) !important",
                        }
                      }
                    },
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: {
                        "& .MuiOutlinedInput-root": {
                          height: 38,
                          borderRadius: 2.5,
                          bgcolor: "rgba(255,255,255,0.72)",
                          color: "#1d1d1f",
                          fontSize: 13,
                          fontWeight: 500,
                          "& fieldset": { borderColor: "rgba(0,0,0,0.08)" },
                          "&:hover fieldset": { borderColor: "rgba(0,0,0,0.15)" },
                          "&.Mui-focused fieldset": { borderColor: "#0071e3", borderWidth: 1 },
                        },
                      },
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6e6e73" }}>
                    เวลาส่ง (ไม่บังคับ)
                  </Typography>
                  {selectedTime && (
                    <Button
                      onClick={() => setSelectedTime(null)}
                      sx={{
                        p: 0,
                        minWidth: 0,
                        height: "auto",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#ff3b30",
                        textTransform: "none",
                        "&:hover": { bgcolor: "transparent", color: "#d9261c" }
                      }}
                    >
                      ล้างค่า
                    </Button>
                  )}
                </Stack>
                <TimePicker
                  value={selectedTime}
                  onChange={(newValue) => setSelectedTime(newValue)}
                  ampm={false}
                  slotProps={{
                    popper: {
                      sx: {
                        "& .MuiPaper-root": {
                          bgcolor: "#ffffff !important",
                          boxShadow: "0 10px 40px rgba(0,0,0,0.12) !important",
                          border: "1px solid rgba(0,0,0,0.08) !important",
                        }
                      }
                    },
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: {
                        "& .MuiOutlinedInput-root": {
                          height: 38,
                          borderRadius: 2.5,
                          bgcolor: "rgba(255,255,255,0.72)",
                          color: "#1d1d1f",
                          fontSize: 13,
                          fontWeight: 500,
                          "& fieldset": { borderColor: "rgba(0,0,0,0.08)" },
                          "&:hover fieldset": { borderColor: "rgba(0,0,0,0.15)" },
                          "&.Mui-focused fieldset": { borderColor: "#0071e3", borderWidth: 1 },
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Stack>
          </LocalizationProvider>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1.5 }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          sx={{ 
            flex: 1,
            height: 36,
            borderRadius: 2.5, 
            borderColor: "rgba(0,0,0,0.12)",
            color: "#1d1d1f", 
            fontWeight: 600,
            fontSize: 13,
            textTransform: "none", 
            bgcolor: "rgba(255,255,255,0.6)",
            "&:hover": { 
              borderColor: "rgba(0,0,0,0.24)", 
              bgcolor: "rgba(0,0,0,0.03)" 
            } 
          }}
        >
          ยกเลิก
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          sx={{ 
            flex: 1,
            height: 36,
            borderRadius: 2.5, 
            bgcolor: "#0071e3", 
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            textTransform: "none", 
            boxShadow: "none",
            "&:hover": { 
              bgcolor: "#005bb5", 
              boxShadow: "none" 
            } 
          }}
        >
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ActionsTab({
  group,
  pendingActionsCount,
  onToggleActionItem,
  onCreateActionItem,
  onUpdateActionItem,
  onDeleteActionItem,
}: {
  group: LineGroup;
  pendingActionsCount: number;
  onToggleActionItem: (groupId: string, itemId: string) => void;
  onCreateActionItem: (groupId: string, data: { task: string; assignee: string; dueDate?: string }) => Promise<void>;
  onUpdateActionItem: (itemId: string, data: { task: string; assignee: string; dueDate?: string }) => Promise<void>;
  onDeleteActionItem: (groupId: string, itemId: string) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "update">("create");
  const [selectedItem, setSelectedItem] = useState<{ id: string; task: string; assignee: string; dueDate?: string } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemIdToDelete, setItemIdToDelete] = useState<string | null>(null);

  // Sort: pending before completed; within same status: today first, then oldest ascending
  const sortedActionItems = React.useMemo(() => {
    const todayKey = dayjs().format("YYYY-MM-DD");
    return [...group.actionItems].sort((a, b) => {
      if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
      const parseDate = (item: typeof a) => {
        if (!item.assignedDate) return null;
        const parts = item.assignedDate.split("/");
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return item.assignedDate;
      };
      const dA = parseDate(a);
      const dB = parseDate(b);
      const aToday = dA === todayKey ? 1 : 0;
      const bToday = dB === todayKey ? 1 : 0;
      if (aToday !== bToday) return bToday - aToday; // today first
      if (dA && dB) { if (dA < dB) return -1; if (dA > dB) return 1; }
      if (dA && !dB) return -1;
      if (!dA && dB) return 1;
      return 0;
    });
  }, [group.actionItems]);

  const handleOpenCreate = () => {
    setDialogMode("create");
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: { id: string; task: string; assignee: string; dueDate?: string }) => {
    setDialogMode("update");
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleSave = async (data: { task: string; assignee: string; dueDate?: string }) => {
    setDialogOpen(false);
    if (dialogMode === "create") {
      await onCreateActionItem(group.id, data);
    } else if (dialogMode === "update" && selectedItem) {
      await onUpdateActionItem(selectedItem.id, data);
    }
  };

  const handleDelete = (itemId: string) => {
    setItemIdToDelete(itemId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemIdToDelete) {
      await onDeleteActionItem(group.id, itemIdToDelete);
    }
    setDeleteConfirmOpen(false);
    setItemIdToDelete(null);
  };

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, gap: 1.5, pb: 1.5, borderBottom: "1px solid #e4e4e7" }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.8 }}>งานค้างสะสมจากทุกวัน ทำเครื่องหมายเมื่อเสร็จสิ้น</Typography>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", alignSelf: { xs: "flex-start", sm: "center" } }}>
          <Chip size="small" label={`งานค้างสะสม: ${pendingActionsCount}`} sx={{ bgcolor: "#f4f4f5", fontWeight: 600 }} />
          <Button
            size="small"
            variant="contained"
            startIcon={<Plus size={14} />}
            onClick={handleOpenCreate}
            sx={{
              height: 28,
              borderRadius: 2,
              bgcolor: "#0071e3",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { bgcolor: "#005bb5", boxShadow: "none" }
            }}
          >
            เพิ่มงาน
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1.5} sx={{ maxHeight: 390, overflowY: "auto", pr: 0.5 }}>
        {sortedActionItems.map((item) => {
          const completed = item.status === "completed";
          return (
            <Paper
              key={item.id}
              elevation={0}
              sx={{
                p: 2,
                border: "1px solid #e4e4e7",
                borderRadius: 2.5,
                bgcolor: completed ? "#fafafa" : "#fff",
                opacity: completed ? 0.68 : 1,
                position: "relative",
                "&:hover .action-buttons": { opacity: 1 },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                  <Checkbox checked={completed} onChange={() => onToggleActionItem(group.id, item.id)} sx={{ p: 0.25, color: "#d4d4d8", "&.Mui-checked": { color: "#059669" } }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 14, lineHeight: 1.75, fontWeight: 500, color: completed ? "#a1a1aa" : "#27272a", textDecoration: completed ? "line-through" : "none", wordBreak: "break-word" }}>{item.task}</Typography>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1, mt: 1.5 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#6e6e73", mr: 0.5 }}>ผู้รับผิดชอบ:</Typography>
                      {item.assignee.split(",").map(name => name.trim()).filter(Boolean).map((name, idx) => {
                        const matched = group.contributors.find(c => c.name.toLowerCase() === name.toLowerCase());
                        const avatarSrc = matched?.profileImageUrl || undefined;
                        const bgColor = matched?.avatarColor || getAvatarColor(name);
                        
                        return (
                          <Chip
                            key={idx}
                            size="small"
                            avatar={
                              <Avatar 
                                src={avatarSrc}
                                sx={{ 
                                  bgcolor: avatarSrc ? "transparent" : bgColor, 
                                  color: "#fff", 
                                  fontSize: 9, 
                                  fontWeight: 700 
                                }}
                              >
                                {!avatarSrc && getInitials(name)}
                              </Avatar>
                            }
                            label={name}
                            sx={{ bgcolor: "#f4f4f5", fontWeight: 500, fontSize: 11, border: "1px solid rgba(0,0,0,0.04)" }}
                          />
                        );
                      })}
                      {item.assignedDate && (
                        <Chip
                          size="small"
                          icon={<Calendar size={12} />}
                          label={`วันที่สั่ง: ${item.assignedDate}`}
                          sx={{ bgcolor: "#eef2ff", color: "#4338ca", fontWeight: 500, fontSize: 11, border: "1px solid #c7d2fe" }}
                        />
                      )}
                      {item.dueDate && (
                        <Chip
                          size="small"
                          icon={<Clock size={12} />}
                          label={`กำหนดส่ง: ${item.dueDate}`}
                          sx={{ bgcolor: "#fafafa", fontWeight: 500, fontSize: 11, border: "1px solid rgba(0,0,0,0.04)", ml: "auto" }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  className="action-buttons"
                  spacing={0.5}
                  sx={{
                    opacity: 0,
                    transition: "opacity 150ms ease",
                    ml: 1,
                    flexShrink: 0,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleOpenEdit({ id: item.id, task: item.task, assignee: item.assignee, dueDate: item.dueDate || "" })}
                    sx={{ color: "#71717a", "&:hover": { color: "#0071e3", bgcolor: "rgba(0,113,227,0.08)" } }}
                  >
                    <Edit2 size={14} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(item.id)}
                    sx={{ color: "#71717a", "&:hover": { color: "#e11d48", bgcolor: "rgba(225,29,72,0.08)" } }}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          );
        })}

        {group.actionItems.length === 0 && <EmptyState icon={ListTodo} text="ไม่พบงานมอบหมายจากการวิเคราะห์กลุ่มแชทนี้" />}
      </Stack>

      <TaskDialog
        open={dialogOpen}
        title={dialogMode === "create" ? "เพิ่มงานใหม่" : "แก้ไขงาน"}
        contributors={group.contributors}
        initialValues={selectedItem || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "16px",
              p: 2.5,
              bgcolor: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.12)",
              maxWidth: 420,
            }
          }
        }}
      >
        <Stack direction="row" spacing={2} sx={{ pb: 1, alignItems: "flex-start" }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: "#fff1f2", 
              color: "#ff3b30",
              border: "1px solid #ffe4e6",
              borderRadius: "10px",
              flexShrink: 0
            }}
          >
            <Trash2 size={20} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 16, p: 0, mb: 1, color: "#1d1d1f" }}>
              ยืนยันการลบงาน
            </DialogTitle>
            <Typography sx={{ fontSize: 13.5, color: "#6e6e73", lineHeight: 1.6 }}>
              คุณแน่ใจหรือไม่ว่าต้องการลบงานนี้? เมื่อลบแล้ว ข้อมูลงานจะไม่สามารถกู้คืนกลับมาได้
            </Typography>
          </Box>
        </Stack>
        
        <DialogActions sx={{ px: 0, pb: 0, pt: 2, gap: 1.5, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            variant="outlined"
            sx={{
              flex: 1,
              height: 38,
              borderRadius: "10px",
              borderColor: "rgba(0,0,0,0.12)",
              color: "#1d1d1f",
              fontWeight: 600,
              fontSize: 13,
              textTransform: "none",
              bgcolor: "rgba(255,255,255,0.72)",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.24)",
                bgcolor: "rgba(0,0,0,0.03)"
              }
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              flex: 1,
              height: 38,
              borderRadius: "10px",
              bgcolor: "#ff3b30",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              textTransform: "none",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#d9261c",
                boxShadow: "none"
              }
            }}
          >
            ลบงาน
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

interface TopicDialogProps {
  open: boolean;
  title: string;
  initialValues?: { name: string; category: string; relevance: number; keyPoints: string[] };
  onClose: () => void;
  onSave: (data: { name: string; category: string; relevance: number; keyPoints: string[] }) => void;
}

function TopicDialog({ open, title, initialValues, onClose, onSave }: TopicDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"urgent" | "work" | "finance" | "social" | "general">("general");
  const [relevance, setRelevance] = useState<number>(80);
  const [keyPointsText, setKeyPointsText] = useState("");

  React.useEffect(() => {
    if (open) {
      setName(initialValues?.name || "");
      setCategory((initialValues?.category as any) || "general");
      setRelevance(initialValues?.relevance !== undefined ? initialValues.relevance : 80);
      setKeyPointsText(initialValues?.keyPoints ? initialValues.keyPoints.join("\n") : "");
    }
  }, [open, initialValues]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("กรุณากรอกหัวข้อหลัก");
      return;
    }
    if (relevance < 10 || relevance > 100) {
      toast.error("ระดับความสำคัญต้องอยู่ระหว่าง 10 ถึง 100");
      return;
    }
    const points = keyPointsText.split("\n").map(p => p.trim()).filter(Boolean);
    if (points.length === 0) {
      toast.error("กรุณากรอกประเด็นย่อยอย่างน้อย 1 รายการ");
      return;
    }
    onSave({
      name: name.trim(),
      category,
      relevance: Number(relevance),
      keyPoints: points
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            p: 1.5,
            bgcolor: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
          }
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1, color: "#1d1d1f" }}>
        {title}
      </DialogTitle>
      
      <DialogContent sx={{ pb: 2 }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {/* Topic Name */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", mb: 0.75 }}>
              ชื่อประเด็น <Box component="span" sx={{ color: "#ff3b30" }}>*</Box>
            </Typography>
            <TextField
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ระบุชื่อประเด็นสำคัญ..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: 38,
                  borderRadius: 2.5,
                  bgcolor: "rgba(255,255,255,0.72)",
                  color: "#1d1d1f",
                  fontSize: 13,
                  fontWeight: 500,
                  "& fieldset": { borderColor: "rgba(0,0,0,0.08)" },
                  "&:hover fieldset": { borderColor: "rgba(0,0,0,0.15)" },
                  "&.Mui-focused fieldset": { borderColor: "#0071e3", borderWidth: 1 },
                },
              }}
            />
          </Box>

          {/* Category + Relevance Row */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", mb: 0.75 }}>
                หมวดหมู่ <Box component="span" sx={{ color: "#ff3b30" }}>*</Box>
              </Typography>
              <TextField
                select
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                slotProps={{
                  select: { native: true }
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 38,
                    borderRadius: 2.5,
                    bgcolor: "rgba(255,255,255,0.72)",
                    color: "#1d1d1f",
                    fontSize: 13,
                    fontWeight: 500,
                    "& fieldset": { borderColor: "rgba(0,0,0,0.08)" },
                    "&:hover fieldset": { borderColor: "rgba(0,0,0,0.15)" },
                    "&.Mui-focused fieldset": { borderColor: "#0071e3", borderWidth: 1 },
                  },
                }}
              >
                <option value="general">ทั่วไป (general)</option>
                <option value="urgent">เร่งด่วน (urgent)</option>
                <option value="work">งาน (work)</option>
                <option value="finance">การเงิน (finance)</option>
                <option value="social">สังคม (social)</option>
              </TextField>
            </Box>

            {/* Relevance */}
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", mb: 0.75 }}>
                ระดับความสำคัญ <Box component="span" sx={{ color: "#ff3b30" }}>*</Box>
              </Typography>
              <TextField
                select
                fullWidth
                value={relevance}
                onChange={(e) => setRelevance(Number(e.target.value))}
                slotProps={{
                  select: { native: true }
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 38,
                    borderRadius: 2.5,
                    bgcolor: "rgba(255,255,255,0.72)",
                    color: "#1d1d1f",
                    fontSize: 13,
                    fontWeight: 500,
                    "& fieldset": { borderColor: "rgba(0,0,0,0.08)" },
                    "&:hover fieldset": { borderColor: "rgba(0,0,0,0.15)" },
                    "&.Mui-focused fieldset": { borderColor: "#0071e3", borderWidth: 1 },
                  },
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
                <option value={60}>60</option>
                <option value={70}>70</option>
                <option value={80}>80</option>
                <option value={90}>90</option>
                <option value={100}>100</option>
              </TextField>
            </Box>
          </Stack>

          {/* Key Points Text Area */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#6e6e73", mb: 0.75 }}>
              ประเด็นย่อย (ขึ้นบรรทัดใหม่เมื่อขึ้นประเด็นใหม่) <Box component="span" sx={{ color: "#ff3b30" }}>*</Box>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="ระบุประเด็นย่อย...&#10;เช่น ประเด็นย่อยที่ 1&#10;ประเด็นย่อยที่ 2"
              value={keyPointsText}
              onChange={(e) => setKeyPointsText(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  bgcolor: "rgba(255,255,255,0.72)",
                  color: "#1d1d1f",
                  fontSize: 13,
                  fontWeight: 500,
                  p: 1.5,
                  "& fieldset": { borderColor: "rgba(0,0,0,0.08)" },
                  "&:hover fieldset": { borderColor: "rgba(0,0,0,0.15)" },
                  "&.Mui-focused fieldset": { borderColor: "#0071e3", borderWidth: 1 },
                },
              }}
            />
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1.5 }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          sx={{ 
            flex: 1,
            height: 36,
            borderRadius: 2.5, 
            borderColor: "rgba(0,0,0,0.12)",
            color: "#1d1d1f", 
            fontWeight: 600,
            fontSize: 13,
            textTransform: "none", 
            bgcolor: "rgba(255,255,255,0.6)",
            "&:hover": { 
              borderColor: "rgba(0,0,0,0.24)", 
              bgcolor: "rgba(0,0,0,0.03)" 
            } 
          }}
        >
          ยกเลิก
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          sx={{ 
            flex: 1,
            height: 36,
            borderRadius: 2.5, 
            bgcolor: "#0071e3", 
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            textTransform: "none", 
            boxShadow: "none",
            "&:hover": { 
              bgcolor: "#005bb5", 
              boxShadow: "none" 
            } 
          }}
        >
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TopicsTab({
  group,
  onCreateTopic,
  onUpdateTopic,
  onDeleteTopic,
}: {
  group: LineGroup;
  onCreateTopic: (groupId: string, data: { name: string; category: string; relevance: number; keyPoints: string[] }) => Promise<void>;
  onUpdateTopic: (topicId: number, data: { name: string; category: string; relevance: number; keyPoints: string[] }) => Promise<void>;
  onDeleteTopic: (groupId: string, topicId: number) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "update">("create");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [topicIdToDelete, setTopicIdToDelete] = useState<number | null>(null);

  const handleOpenCreate = () => {
    setDialogMode("create");
    setSelectedTopic(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (topic: Topic) => {
    setDialogMode("update");
    setSelectedTopic(topic);
    setDialogOpen(true);
  };

  const handleSave = async (data: { name: string; category: string; relevance: number; keyPoints: string[] }) => {
    setDialogOpen(false);
    if (dialogMode === "create") {
      await onCreateTopic(group.id, data);
    } else if (dialogMode === "update" && selectedTopic && selectedTopic.id) {
      await onUpdateTopic(selectedTopic.id, data);
    }
  };

  const handleDeleteClick = (topic: Topic) => {
    if (topic.id) {
      setTopicIdToDelete(topic.id);
      setDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (topicIdToDelete) {
      await onDeleteTopic(group.id, topicIdToDelete);
    }
    setDeleteConfirmOpen(false);
    setTopicIdToDelete(null);
  };

  // Sort topics by relevance descending (highest importance first)
  const sortedTopics = React.useMemo(() => {
    return [...group.topics].sort((a, b) => b.relevance - a.relevance);
  }, [group.topics]);

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", pb: 1.5, borderBottom: "1px solid #e4e4e7" }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 0.8 }}>หัวข้อหลักสำคัญที่วิเคราะห์ได้จากแชท</Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<Plus size={14} />}
          onClick={handleOpenCreate}
          sx={{
            height: 28,
            borderRadius: 2,
            bgcolor: "#0071e3",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "none",
            boxShadow: "none",
            "&:hover": { bgcolor: "#005bb5", boxShadow: "none" }
          }}
        >
          เพิ่มประเด็น
        </Button>
      </Stack>

      <Stack spacing={2}>
        {sortedTopics.map((topic, index) => {
          const color = topicColor(topic.category);
          return (
            <Paper 
              key={topic.id || `${topic.name}-${index}`} 
              elevation={0} 
              sx={{ 
                p: 2.5, 
                border: "1px solid #e4e4e7", 
                borderRadius: 3, 
                bgcolor: "#fff",
                position: "relative",
                "&:hover .action-buttons": { opacity: 1 },
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", gap: 1.5 }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0, flex: 1 }}>
                  <Avatar sx={{ width: 28, height: 28, borderRadius: 2, bgcolor: "#f4f4f5", color: "#71717a", fontSize: 12, fontWeight: 600 }}>#{index + 1}</Avatar>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#27272a" }}>{topic.name}</Typography>
                </Stack>
                
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexShrink: 0 }}>
                  <Chip size="small" label={topic.category} sx={{ bgcolor: color.bg, color: color.color, border: `1px solid ${color.border}`, fontWeight: 600, textTransform: "uppercase", fontSize: 10 }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#71717a" }}>ความสำคัญ: {topic.relevance}%</Typography>
                  
                  <Stack
                    direction="row"
                    className="action-buttons"
                    spacing={0.5}
                    sx={{
                      opacity: 0,
                      transition: "opacity 150ms ease",
                      ml: 1,
                      flexShrink: 0,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEdit(topic)}
                      sx={{ color: "#71717a", "&:hover": { color: "#0071e3", bgcolor: "rgba(0,113,227,0.08)" } }}
                    >
                      <Edit2 size={14} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(topic)}
                      sx={{ color: "#71717a", "&:hover": { color: "#e11d48", bgcolor: "rgba(225,29,72,0.08)" } }}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </Stack>
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

        {group.topics.length === 0 && <EmptyState icon={Hash} text="ไม่พบหัวข้อหลักจากการวิเคราะห์กลุ่มแชทนี้" />}
      </Stack>

      {/* Create / Edit Topic Dialog */}
      <TopicDialog
        open={dialogOpen}
        title={dialogMode === "create" ? "เพิ่มประเด็นสำคัญใหม่" : "แก้ไขประเด็นสำคัญ"}
        initialValues={selectedTopic || undefined}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "16px",
              p: 2.5,
              bgcolor: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.12)",
              maxWidth: 420,
            }
          }
        }}
      >
        <Stack direction="row" spacing={2} sx={{ pb: 1, alignItems: "flex-start" }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: "#fff1f2", 
              color: "#ff3b30",
              border: "1px solid #ffe4e6",
              borderRadius: "10px",
              flexShrink: 0
            }}
          >
            <Trash2 size={20} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <DialogTitle sx={{ fontWeight: 700, fontSize: 16, p: 0, mb: 1, color: "#1d1d1f" }}>
              ยืนยันการลบประเด็นสำคัญ
            </DialogTitle>
            <Typography sx={{ fontSize: 13.5, color: "#6e6e73", lineHeight: 1.6 }}>
              คุณแน่ใจหรือไม่ว่าต้องการลบประเด็นสำคัญนี้? เมื่อลบแล้ว ข้อมูลจะไม่สามารถกู้คืนกลับมาได้
            </Typography>
          </Box>
        </Stack>
        
        <DialogActions sx={{ px: 0, pb: 0, pt: 2, gap: 1.5, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            variant="outlined"
            sx={{
              flex: 1,
              height: 38,
              borderRadius: "10px",
              borderColor: "rgba(0,0,0,0.12)",
              color: "#1d1d1f",
              fontWeight: 600,
              fontSize: 13,
              textTransform: "none",
              bgcolor: "rgba(255,255,255,0.72)",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.24)",
                bgcolor: "rgba(0,0,0,0.03)"
              }
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              flex: 1,
              height: 38,
              borderRadius: "10px",
              bgcolor: "#ff3b30",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              textTransform: "none",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#d9261c",
                boxShadow: "none"
              }
            }}
          >
            ลบประเด็น
          </Button>
        </DialogActions>
      </Dialog>
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
                <Avatar 
                  src={contributor.profileImageUrl || undefined}
                  sx={{ 
                    width: 26, 
                    height: 26, 
                    borderRadius: 2, 
                    bgcolor: contributor.profileImageUrl ? "transparent" : (index === 0 ? "#fef3c7" : "#f4f4f5"), 
                    color: index === 0 ? "#92400e" : "#71717a", 
                    fontSize: 11, 
                    fontWeight: 600 
                  }}
                >
                  {!contributor.profileImageUrl && (index + 1)}
                </Avatar>
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

// ── Read-only History Panels ──────────────────────────────────────────────

function HistoryActionsPanel({ items }: { items: { task: string; assignee: string; assignedDate?: string; dueDate?: string }[] }) {
  if (!items || items.length === 0) {
    return (
      <Stack spacing={1.5} sx={{ py: 8, alignItems: "center", color: "#a1a1aa" }}>
        <CheckCircle size={34} color="#d4d4d8" />
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>ไม่มีงานที่ต้องทำในวันนี้</Typography>
      </Stack>
    );
  }
  return (
    <Stack spacing={2}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#7c3aed", display: "flex", alignItems: "center", gap: 0.75 }}>
        <History size={12} />
        ข้อมูลย้อนหลัง — อ่านได้อย่างเดียว
      </Typography>
      {items.map((item, idx) => (
        <Paper key={idx} elevation={0} sx={{ p: 2, border: "1px solid #e4e4e7", borderRadius: 2.5, bgcolor: "#fafafa" }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <Box sx={{ mt: 0.25, width: 16, height: 16, borderRadius: "50%", border: "1.5px solid #d4d4d8", flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: "#27272a", lineHeight: 1.6 }}>{item.task}</Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 0.75 }}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: "#71717a" }}>ผู้รับผิดชอบ: {item.assignee}</Typography>
                {item.assignedDate && <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: "#71717a" }}>วันที่สั่ง: {item.assignedDate}</Typography>}
                {item.dueDate && <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: "#71717a" }}>กำหนด: {item.dueDate}</Typography>}
              </Stack>
            </Box>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

function HistoryTopicsPanel({ topics }: { topics: { name: string; category: string; relevance: number; keyPoints: string[] }[] }) {
  if (!topics || topics.length === 0) {
    return (
      <Stack spacing={1.5} sx={{ py: 8, alignItems: "center", color: "#a1a1aa" }}>
        <Hash size={34} color="#d4d4d8" />
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>ไม่มีประเด็นสำคัญในวันนี้</Typography>
      </Stack>
    );
  }
  // Sort topics by relevance descending (highest importance first)
  const sortedTopics = [...topics].sort((a, b) => b.relevance - a.relevance);
  return (
    <Stack spacing={2.5}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#7c3aed", display: "flex", alignItems: "center", gap: 0.75 }}>
        <History size={12} />
        ข้อมูลย้อนหลัง — อ่านได้อย่างเดียว
      </Typography>
      {sortedTopics.map((topic, idx) => {
        const colors = topicColor(topic.category);
        return (
          <Paper key={idx} elevation={0} sx={{ p: 2.5, border: `1px solid ${colors.border}`, borderLeft: `3px solid ${colors.color}`, borderRadius: 2.5, bgcolor: colors.bg }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.25 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: colors.color, flexShrink: 0 }} />
              <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#18181b" }}>{topic.name}</Typography>
              <Chip
                size="small"
                label={`${topic.relevance}%`}
                sx={{ height: 20, fontSize: 11, fontWeight: 600, bgcolor: colors.color + "18", color: colors.color, border: `1px solid ${colors.border}` }}
              />
            </Stack>
            <Box component="ul" sx={{ m: 0, pl: 2.25, display: "flex", flexDirection: "column", gap: 0.5 }}>
              {(topic.keyPoints || []).map((point, pidx) => (
                <Typography key={pidx} component="li" sx={{ fontSize: 13, lineHeight: 1.7, color: "#52525b" }}>{point}</Typography>
              ))}
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
}

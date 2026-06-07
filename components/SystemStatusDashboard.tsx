"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock,
  Database,
  Lock,
  Play,
  RefreshCw,
  Settings,
  ShieldAlert,
  Sparkles,
  Terminal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  clearSystemLogs,
  getSystemLogs,
  getSystemStatus,
  saveSystemSettings,
  testApiConnections,
  triggerDailySummaryJob,
} from "@/app/actions/status";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

type TabType = "env" | "webhook" | "logs" | "cron";
type LogEntry = {
  id: string | number;
  type: string;
  level: "info" | "warning" | "error" | string;
  message: string;
  details?: string | null;
  timestamp: string | Date;
};
type ConfigItem = {
  name: string;
  isConfigured: boolean;
  description?: string;
};
type ApiCheckResult = {
  ok: boolean;
  label: string;
  message: string;
  details?: string;
};
type ApiCheckResponse = {
  success: boolean;
  checkedAt: string;
  results: Record<string, ApiCheckResult>;
};
type SystemStatus = {
  dbConnected: boolean;
  dbError: string | null;
  config: {
    geminiApiKey?: ConfigItem;
    lineChannelSecret?: ConfigItem;
    lineChannelAccessToken?: ConfigItem;
    [key: string]: ConfigItem | undefined;
  };
  stats: {
    webhook: {
      total: number;
      success: number;
      failed: number;
      warning: number;
      lastActive?: string | Date | null;
    };
  };
};

const tabItems: Array<{ id: TabType; label: string; icon: React.ComponentType<{ size?: number; color?: string }> }> = [
  { id: "env", label: "API Settings", icon: Lock },
  { id: "webhook", label: "LINE Webhook", icon: Activity },
  { id: "logs", label: "System Logs", icon: Terminal },
  { id: "cron", label: "Daily Cron", icon: Clock },
];

function levelLabel(level: string) {
  if (level === "error") return "Error";
  if (level === "warning") return "Warning";
  return "Success";
}

function levelColor(level: string) {
  if (level === "error") return { bg: "#fff1f2", color: "#e11d48", border: "#fecdd3" };
  if (level === "warning") return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
  return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
}

export function SystemStatusDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("env");
  const [statusData, setStatusData] = useState<SystemStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isTestingApis, setIsTestingApis] = useState(false);
  const [apiCheck, setApiCheck] = useState<ApiCheckResponse | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState("");
  const [lineChannelSecretInput, setLineChannelSecretInput] = useState("");
  const [lineChannelAccessTokenInput, setLineChannelAccessTokenInput] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statusRes, logsRes] = await Promise.all([getSystemStatus(), getSystemLogs()]);
      setStatusData(statusRes);
      if (logsRes.success && logsRes.data) setLogs(logsRes.data as LogEntry[]);
    } catch (err: unknown) {
      toast.error(`โหลดสถานะระบบไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void loadData());
  }, []);

  const filteredLogs = useMemo(
    () => logs.filter((log) => (typeFilter === "all" || log.type === typeFilter) && (levelFilter === "all" || log.level === levelFilter)),
    [logs, typeFilter, levelFilter]
  );
  const webhookLogs = useMemo(() => logs.filter((log) => log.type === "webhook").slice(0, 10), [logs]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiApiKeyInput && !lineChannelSecretInput && !lineChannelAccessTokenInput) {
      toast.warning("กรุณากรอกข้อมูลอย่างน้อย 1 รายการ");
      return;
    }
    setIsSavingConfig(true);
    try {
      const res = await saveSystemSettings({
        ...(geminiApiKeyInput ? { geminiApiKey: geminiApiKeyInput } : {}),
        ...(lineChannelSecretInput ? { lineChannelSecret: lineChannelSecretInput } : {}),
        ...(lineChannelAccessTokenInput ? { lineChannelAccessToken: lineChannelAccessTokenInput } : {}),
      });
      if (res.success) {
        toast.success("บันทึกการตั้งค่าเรียบร้อย");
        setGeminiApiKeyInput("");
        setLineChannelSecretInput("");
        setLineChannelAccessTokenInput("");
        await loadData();
      } else {
        toast.error(`บันทึกไม่สำเร็จ: ${res.error}`);
      }
    } catch (err: unknown) {
      toast.error(`บันทึกไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const executeClearLogs = async () => {
    setShowConfirmModal(false);
    setIsActionLoading(true);
    try {
      const res = await clearSystemLogs();
      if (res.success) {
        toast.success("ล้าง System Logs แล้ว");
        await loadData();
      } else {
        toast.error(`ล้าง logs ไม่สำเร็จ: ${res.error}`);
      }
    } catch (err: unknown) {
      toast.error(`ล้าง logs ไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTriggerSummary = async () => {
    setIsActionLoading(true);
    try {
      const res = await triggerDailySummaryJob();
      if (res.success) {
        toast.success(res.message);
        await loadData();
      } else {
        toast.error(`รัน Daily Summary ไม่สำเร็จ: ${res.error}`);
      }
    } catch (err: unknown) {
      toast.error(`รัน Daily Summary ไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTestApis = async () => {
    setIsTestingApis(true);
    try {
      const res = await testApiConnections();
      setApiCheck(res);
      if (res.success) {
        toast.success("API connection test passed");
      } else {
        toast.warning("API connection test completed with issues");
      }
      await loadData();
    } catch (err: unknown) {
      toast.error(`API connection test failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsTestingApis(false);
    }
  };

  if (isLoading && !statusData) {
    return (
      <Box sx={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", bgcolor: "#f6f8fb" }}>
        <Stack spacing={2} sx={{ alignItems: "center", color: "#52525b" }}>
          <CircularProgress size={42} thickness={4} sx={{ color: "#059669" }} />
          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>กำลังโหลดสถานะระบบ...</Typography>
        </Stack>
      </Box>
    );
  }

  const config = statusData?.config ?? {};
  const webhookStats = statusData?.stats?.webhook ?? { total: 0, success: 0, failed: 0, warning: 0 };
  const configItems = Object.values(config).filter(Boolean) as ConfigItem[];
  const configuredCount = configItems.filter((item) => item.isConfigured).length;
  const progressPercent = configItems.length ? Math.round((configuredCount / configItems.length) * 100) : 0;

  return (
    <Box sx={{ display: "flex", flex: 1, minHeight: 0, flexDirection: "column", overflow: "hidden", bgcolor: "#f6f8fb" }}>
      <Box
        component="header"
        sx={{
          px: { xs: 2.5, sm: 4 },
          py: 2.25,
          borderBottom: "1px solid #e4e4e7",
          bgcolor: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(14px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexShrink: 0,
        }}
      >
        <Box>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Settings size={25} color="#059669" />
            <Typography component="h1" sx={{ fontSize: { xs: 22, sm: 28 }, fontWeight: 600, color: "#09090b" }}>
              System Status Dashboard
            </Typography>
          </Stack>
          <Typography sx={{ mt: 0.75, fontSize: 13, fontWeight: 500, color: "#71717a" }}>ตรวจสอบ Webhook, API keys, logs และงานสรุปรายวัน</Typography>
        </Box>
        <Button
          onClick={loadData}
          disabled={isActionLoading || isLoading}
          variant="outlined"
          startIcon={<RefreshCw size={17} className={isLoading ? "app-spin" : ""} />}
          sx={{ borderRadius: 2.5, borderColor: "#e4e4e7", color: "#27272a", fontWeight: 600, bgcolor: "#fff", textTransform: "none" }}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2.5, sm: 4 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: 3,
          }}
        >
          <StatusCard icon={Database} title="MySQL Database" ok={Boolean(statusData?.dbConnected)} value={statusData?.dbConnected ? "Connected" : "Connection error"} description={statusData?.dbConnected ? "Database is active" : statusData?.dbError || "ตรวจสอบ DATABASE_URL"} />
          <StatusCard icon={Activity} title="Webhook Health" ok={webhookStats.total > 0 && webhookStats.failed === 0} value={webhookStats.total > 0 ? `${webhookStats.total} requests` : "No requests"} description={webhookStats.failed > 0 ? `พบข้อผิดพลาด ${webhookStats.failed} รายการล่าสุด` : "สถานะ webhook ปกติ"} />
          <StatusCard icon={Sparkles} title="Gemini AI Service" ok={Boolean(config.geminiApiKey?.isConfigured)} value={config.geminiApiKey?.isConfigured ? "Configured" : "Missing API key"} description={config.geminiApiKey?.isConfigured ? "พร้อมใช้งาน" : "กรุณาตั้งค่า GEMINI_API_KEY"} />
        </Box>

        <Paper elevation={0} sx={{ mt: 3, overflow: "hidden", border: "1px solid #e4e4e7", borderRadius: 4, bgcolor: "#fff" }}>
          <Box sx={{ px: 2.5, pt: 2, borderBottom: "1px solid #e4e4e7", bgcolor: "#fafafa" }}>
            <Tabs value={activeTab} onChange={(_, value: TabType) => setActiveTab(value)} variant="scrollable" scrollButtons="auto" sx={{ "& .MuiTabs-indicator": { bgcolor: "#059669", height: 3 }, "& .MuiTab-root": { fontWeight: 600, textTransform: "none", color: "#71717a" }, "& .Mui-selected": { color: "#047857 !important" } }}>
              {tabItems.map((tab) => {
                const Icon = tab.icon;
                return <Tab key={tab.id} value={tab.id} icon={<Icon size={16} />} iconPosition="start" label={tab.label} />;
              })}
            </Tabs>
          </Box>
          <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
            {activeTab === "env" && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2fr) minmax(320px, 1fr)" },
                  gap: 4,
                  alignItems: "start",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Paper component="form" onSubmit={handleSaveSettings} elevation={0} sx={{ p: 3, border: "1px solid #e4e4e7", borderRadius: 4 }}>
                    <SectionTitle icon={Lock} title="API Settings" description="อัปเดต secret ที่ใช้เชื่อมต่อ Gemini และ LINE" />
                    <Stack spacing={2.5} sx={{ mt: 3 }}>
                      <SecretInput label="GEMINI_API_KEY" value={geminiApiKeyInput} onChange={setGeminiApiKeyInput} configured={Boolean(config.geminiApiKey?.isConfigured)} />
                      <SecretInput label="LINE_CHANNEL_SECRET" value={lineChannelSecretInput} onChange={setLineChannelSecretInput} configured={Boolean(config.lineChannelSecret?.isConfigured)} />
                      <SecretInput label="LINE_CHANNEL_ACCESS_TOKEN" value={lineChannelAccessTokenInput} onChange={setLineChannelAccessTokenInput} configured={Boolean(config.lineChannelAccessToken?.isConfigured)} />
                      <Button type="submit" variant="contained" disabled={isSavingConfig || (!geminiApiKeyInput && !lineChannelSecretInput && !lineChannelAccessTokenInput)} startIcon={isSavingConfig ? <RefreshCw size={17} className="app-spin" /> : <Play size={17} />} sx={{ minHeight: 44, borderRadius: 2.5, bgcolor: "#059669", fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#047857" } }}>
                        Save Config
                      </Button>
                      <Button type="button" onClick={handleTestApis} variant="outlined" disabled={isTestingApis || isSavingConfig} startIcon={<RefreshCw size={17} className={isTestingApis ? "app-spin" : ""} />} sx={{ minHeight: 44, borderRadius: 2.5, borderColor: "#d4d4d8", color: "#27272a", fontWeight: 600, textTransform: "none" }}>
                        Test API Connections
                      </Button>
                    </Stack>
                  </Paper>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Stack spacing={3}>
                    {apiCheck && (
                      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${apiCheck.success ? "#a7f3d0" : "#fde68a"}`, borderRadius: 4, bgcolor: apiCheck.success ? "#f0fdf4" : "#fffbeb" }}>
                        <Stack direction="row" sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "#71717a", textTransform: "uppercase" }}>Latest API Test</Typography>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#71717a" }}>{new Date(apiCheck.checkedAt).toLocaleString("th-TH")}</Typography>
                        </Stack>
                        <Stack spacing={1.5} sx={{ mt: 2 }}>
                          {Object.entries(apiCheck.results).map(([key, result]) => <ApiCheckRow key={key} result={result} />)}
                        </Stack>
                      </Paper>
                    )}
                    <Paper elevation={0} sx={{ p: 3, border: "1px solid #e4e4e7", borderRadius: 4 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "#a1a1aa", textTransform: "uppercase" }}>System Readiness</Typography>
                      <Stack direction="row" sx={{ mt: 1.5, alignItems: "baseline", justifyContent: "space-between" }}>
                        <Typography sx={{ fontSize: 28, fontWeight: 600 }}>{progressPercent}%</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#047857" }}>{configuredCount}/{configItems.length} ready</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={progressPercent} sx={{ mt: 1.5, height: 6, borderRadius: 999, bgcolor: "#f4f4f5", "& .MuiLinearProgress-bar": { bgcolor: "#10b981", borderRadius: 999 } }} />
                    </Paper>
                    <Paper elevation={0} sx={{ p: 3, border: "1px solid #e4e4e7", borderRadius: 4 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "#a1a1aa", textTransform: "uppercase" }}>Environment Status</Typography>
                      <Stack spacing={1.5} sx={{ mt: 2 }}>
                        {configItems.map((item) => <ConfigRow key={item.name} item={item} />)}
                      </Stack>
                    </Paper>
                  </Stack>
                </Box>
              </Box>
            )}

            {activeTab === "webhook" && (
              <Stack spacing={3}>
                <SectionTitle icon={Activity} title="LINE Webhook" description="สถิติ request ล่าสุดจาก LINE webhook" />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
                    gap: 2,
                  }}
                >
                  <Metric label="Total" value={webhookStats.total} />
                  <Metric label="Success" value={webhookStats.success} color="#059669" />
                  <Metric label="Failed" value={webhookStats.failed} color="#e11d48" />
                  <Metric label="Warning" value={webhookStats.warning} color="#d97706" />
                </Box>
                <LogList logs={webhookLogs} emptyText="ยังไม่มี LINE webhook logs" onSelect={setSelectedLog} />
              </Stack>
            )}

            {activeTab === "logs" && (
              <Stack spacing={3}>
                <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", gap: 2 }}>
                  <SectionTitle icon={Terminal} title="System Logs" description="ตรวจสอบเหตุการณ์ของระบบ, webhook และ cron" />
                  <Button onClick={() => setShowConfirmModal(true)} disabled={isActionLoading || logs.length === 0} variant="outlined" color="error" startIcon={<Trash2 size={17} />} sx={{ alignSelf: { xs: "flex-start", sm: "center" }, borderRadius: 2.5, fontWeight: 600, textTransform: "none" }}>
                    Clear Logs
                  </Button>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2 }}>
                  <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={["all", "webhook", "ai_summary", "cron", "system"]} />
                  <FilterSelect label="Level" value={levelFilter} onChange={setLevelFilter} options={["all", "info", "warning", "error"]} />
                </Stack>
                <LogList logs={filteredLogs} emptyText="ไม่พบ logs ตามตัวกรองที่เลือก" onSelect={setSelectedLog} />
              </Stack>
            )}

            {activeTab === "cron" && (
              <Stack spacing={3}>
                <SectionTitle icon={Clock} title="Daily Summary Cron" description="รันงานสรุปบทสนทนาแบบ manual เมื่อต้องการทดสอบ" />
                <Alert severity="info" sx={{ borderRadius: 3 }}>
                  <Typography sx={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 600 }}>GET /api/cron/daily-summary?secret=[CRON_SECRET]</Typography>
                  <Typography sx={{ mt: 0.75, fontSize: 13, fontWeight: 500 }}>ใช้ endpoint นี้กับ Vercel Cron, cron-job.org หรือ GitHub Actions</Typography>
                </Alert>
                <Button onClick={handleTriggerSummary} disabled={isActionLoading} variant="contained" startIcon={isActionLoading ? <RefreshCw size={17} className="app-spin" /> : <Play size={17} />} sx={{ alignSelf: "flex-start", borderRadius: 2.5, bgcolor: "#059669", fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#047857" } }}>
                  Run Daily Summary
                </Button>
              </Stack>
            )}
          </Box>
        </Paper>
      </Box>

      <LogDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      <ConfirmDialog open={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={executeClearLogs} />
    </Box>
  );
}

function StatusCard({ icon: Icon, title, ok, value, description }: { icon: React.ComponentType<{ size?: number; color?: string }>; title: string; ok: boolean; value: string; description: string }) {
  const color = ok ? "#059669" : "#e11d48";
  return (
    <Paper elevation={0} sx={{ height: "100%", p: 2, border: "1px solid #e4e4e7", borderRadius: 3, bgcolor: "#fff" }}>
      <Stack direction="row" spacing={1.75} sx={{ alignItems: "center" }}>
        <Avatar sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: `${color}12`, color, border: `1px solid ${color}18` }}>
          <Icon size={18} color={color} />
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.8, color: "#a1a1aa", textTransform: "uppercase" }}>
            {title}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, alignItems: "center" }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />
            <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600, color: "#18181b" }}>
              {value}
            </Typography>
          </Stack>
          <Typography noWrap sx={{ mt: 0.25, fontSize: 11, fontWeight: 400, color: "#71717a" }}>
            {description}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function SectionTitle({ icon: Icon, title, description }: { icon: React.ComponentType<{ size?: number; color?: string }>; title: string; description: string }) {
  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Icon size={20} color="#059669" />
        <Typography sx={{ fontSize: 18, fontWeight: 600 }}>{title}</Typography>
      </Stack>
      <Typography sx={{ mt: 0.75, fontSize: 13, fontWeight: 500, color: "#71717a" }}>{description}</Typography>
    </Box>
  );
}

function SecretInput({ label, value, onChange, configured }: { label: string; value: string; onChange: (value: string) => void; configured: boolean }) {
  return (
    <TextField
      fullWidth
      type="password"
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={configured ? "ตั้งค่าแล้ว - กรอกใหม่เมื่อต้องการเปลี่ยน" : `กรอก ${label}`}
      helperText={configured ? "พร้อมใช้งาน" : "ยังไม่ได้ตั้งค่า"}
      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 }, "& .MuiFormHelperText-root": { color: configured ? "#047857" : "#a1a1aa", fontWeight: 600 } }}
    />
  );
}

function ConfigRow({ item }: { item: ConfigItem }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 2, py: 1 }}>
      <Typography noWrap sx={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 600 }}>{item.name}</Typography>
      <Chip size="small" label={item.isConfigured ? "พร้อม" : "ยังไม่ตั้งค่า"} sx={{ bgcolor: item.isConfigured ? "#ecfdf5" : "#fff1f2", color: item.isConfigured ? "#047857" : "#e11d48", border: `1px solid ${item.isConfigured ? "#a7f3d0" : "#fecdd3"}`, fontWeight: 600, fontSize: 10 }} />
    </Stack>
  );
}

function ApiCheckRow({ result }: { result: ApiCheckResult }) {
  return (
    <Box sx={{ p: 1.5, border: `1px solid ${result.ok ? "#a7f3d0" : "#fed7aa"}`, borderRadius: 2.5, bgcolor: "#fff" }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1.5 }}>
        <Typography noWrap sx={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700 }}>{result.label}</Typography>
        <Chip size="small" label={result.ok ? "OK" : "Issue"} sx={{ flexShrink: 0, bgcolor: result.ok ? "#ecfdf5" : "#fff7ed", color: result.ok ? "#047857" : "#c2410c", border: `1px solid ${result.ok ? "#a7f3d0" : "#fed7aa"}`, fontWeight: 700, fontSize: 10 }} />
      </Stack>
      <Typography sx={{ mt: 0.75, fontSize: 12.5, lineHeight: 1.6, fontWeight: 500, color: "#52525b" }}>{result.message}</Typography>
      {result.details && (
        <Typography sx={{ mt: 0.75, fontFamily: "var(--font-geist-mono)", fontSize: 11, lineHeight: 1.6, color: "#71717a", wordBreak: "break-word" }}>
          {result.details}
        </Typography>
      )}
    </Box>
  );
}

function Metric({ label, value, color = "#27272a" }: { label: string; value: number; color?: string }) {
  return (
    <Paper elevation={0} sx={{ minHeight: 100, p: 2.5, border: "1px solid #e4e4e7", borderRadius: 4, bgcolor: "#fafafa" }}>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase" }}>{label}</Typography>
      <Typography sx={{ mt: 1.25, fontSize: 30, fontWeight: 600, color }}>{value}</Typography>
    </Paper>
  );
}

function LogList({ logs, emptyText, onSelect }: { logs: LogEntry[]; emptyText: string; onSelect: (log: LogEntry) => void }) {
  if (logs.length === 0) {
    return <Paper elevation={0} sx={{ py: 6, border: "1px dashed #d4d4d8", borderRadius: 4, textAlign: "center" }}><Typography sx={{ fontSize: 14, fontWeight: 500, color: "#a1a1aa" }}>{emptyText}</Typography></Paper>;
  }
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e4e4e7", borderRadius: 4, maxHeight: 520 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            {["Timestamp", "Type", "Level", "Message", "Action"].map((head) => <TableCell key={head} sx={{ bgcolor: "#fafafa", fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase" }}>{head}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log) => {
            const color = levelColor(log.level);
            return (
              <TableRow key={log.id} hover>
                <TableCell sx={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "#71717a", whiteSpace: "nowrap" }}>{new Date(log.timestamp).toLocaleString("th-TH")}</TableCell>
                <TableCell sx={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>{log.type}</TableCell>
                <TableCell><Chip size="small" label={levelLabel(log.level)} sx={{ bgcolor: color.bg, color: color.color, border: `1px solid ${color.border}`, fontWeight: 600, fontSize: 10 }} /></TableCell>
                <TableCell sx={{ fontSize: 13, fontWeight: 500, maxWidth: 360 }}>{log.message}</TableCell>
                <TableCell align="right">
                  {log.details ? <Button size="small" variant="outlined" onClick={() => onSelect(log)} sx={{ borderRadius: 2, fontWeight: 600, textTransform: "none" }}>รายละเอียด</Button> : <Typography sx={{ fontSize: 12, color: "#a1a1aa", fontStyle: "italic" }}>ไม่มีรายละเอียด</Typography>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#71717a" }}>{label}:</Typography>
      <Select size="small" value={value} onChange={(event) => onChange(event.target.value)} sx={{ minWidth: 140, borderRadius: 2.5, fontWeight: 500 }}>
        {options.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
      </Select>
    </Stack>
  );
}

function LogDrawer({ log, onClose }: { log: LogEntry | null; onClose: () => void }) {
  return (
    <Drawer anchor="right" open={Boolean(log)} onClose={onClose} sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 560 } } }}>
      {log && (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", p: 3, borderBottom: "1px solid #e4e4e7", bgcolor: "#fafafa" }}>
            <Box><Typography sx={{ fontSize: 18, fontWeight: 600 }}>Log Details</Typography><Typography sx={{ mt: 0.5, fontSize: 12, color: "#a1a1aa" }}>ID: {log.id}</Typography></Box>
            <IconButton onClick={onClose}>×</IconButton>
          </Stack>
          <Stack spacing={3} sx={{ p: 3, overflowY: "auto" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              <Detail label="Type" value={log.type} />
              <Detail label="Level" value={levelLabel(log.level)} />
              <Detail label="Time" value={new Date(log.timestamp).toLocaleString("th-TH")} />
            </Box>
            <Detail label="Message" value={log.message} boxed />
            {log.details && (
              <Box><Typography sx={{ mb: 1, fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "#a1a1aa", textTransform: "uppercase" }}>Payload / Stack Trace</Typography><Box component="pre" sx={{ minHeight: 220, overflowX: "auto", whiteSpace: "pre-wrap", m: 0, p: 2.5, borderRadius: 3, bgcolor: "#09090b", color: "#e4e4e7", fontFamily: "var(--font-geist-mono)", fontSize: 12, lineHeight: 1.7 }}>{log.details}</Box></Box>
            )}
          </Stack>
        </Box>
      )}
    </Drawer>
  );
}

function Detail({ label, value, boxed = false }: { label: string; value: React.ReactNode; boxed?: boolean }) {
  return (
    <Box sx={{ minWidth: 0, gridColumn: boxed ? "1 / -1" : undefined }}>
      <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "#a1a1aa", textTransform: "uppercase" }}>{label}</Typography>
      <Typography component="div" sx={{ mt: 0.75, p: boxed ? 2 : 0, border: boxed ? "1px solid #e4e4e7" : 0, borderRadius: boxed ? 2.5 : 0, bgcolor: boxed ? "#fafafa" : "transparent", fontSize: 14, fontWeight: 500, color: "#27272a", lineHeight: 1.75 }}>{value}</Typography>
    </Box>
  );
}

function ConfirmDialog({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
      <DialogTitle sx={{ textAlign: "center", pt: 4 }}>
        <Avatar sx={{ mx: "auto", mb: 2, width: 56, height: 56, borderRadius: 3, bgcolor: "#fff1f2", color: "#e11d48" }}><ShieldAlert size={26} /></Avatar>
        <Typography sx={{ fontSize: 20, fontWeight: 600 }}>ล้าง System Logs?</Typography>
      </DialogTitle>
      <DialogContent><Typography sx={{ textAlign: "center", fontSize: 14, lineHeight: 1.8, color: "#71717a", fontWeight: 500 }}>ข้อมูล logs ทั้งหมดจะถูกลบ และไม่สามารถย้อนกลับได้</Typography></DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button fullWidth onClick={onClose} variant="outlined" sx={{ borderRadius: 2.5, fontWeight: 600, textTransform: "none" }}>Cancel</Button>
        <Button fullWidth onClick={onConfirm} variant="contained" color="error" sx={{ borderRadius: 2.5, fontWeight: 600, textTransform: "none" }}>Clear Logs</Button>
      </DialogActions>
    </Dialog>
  );
}

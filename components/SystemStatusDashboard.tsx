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
  triggerDailySummaryJob,
} from "@/app/actions/status";

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

const tabItems: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "env", label: "API Settings", icon: Lock },
  { id: "webhook", label: "LINE Webhook", icon: Activity },
  { id: "logs", label: "System Logs", icon: Terminal },
  { id: "cron", label: "Daily Cron", icon: Clock },
];

function statusBadge(isOk: boolean) {
  return isOk
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-rose-50 text-rose-700 border-rose-200";
}

function levelBadge(level: string) {
  if (level === "error") return "text-rose-700 bg-rose-50 border-rose-200";
  if (level === "warning") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-emerald-700 bg-emerald-50 border-emerald-200";
}

function levelLabel(level: string) {
  if (level === "error") return "Error";
  if (level === "warning") return "Warning";
  return "Success";
}

export function SystemStatusDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("env");
  const [statusData, setStatusData] = useState<SystemStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
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
      if (logsRes.success && logsRes.data) {
        setLogs(logsRes.data as LogEntry[]);
      }
    } catch (err: unknown) {
      toast.error(`โหลดสถานะระบบไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, []);

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const matchType = typeFilter === "all" || log.type === typeFilter;
        const matchLevel = levelFilter === "all" || log.level === levelFilter;
        return matchType && matchLevel;
      }),
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

  if (isLoading && !statusData) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 text-zinc-500">
        <RefreshCw className="mb-3 size-8 animate-spin text-emerald-600" />
        <p className="text-sm font-semibold">กำลังโหลดสถานะระบบ...</p>
      </div>
    );
  }

  const config = statusData?.config ?? {};
  const webhookStats = statusData?.stats?.webhook ?? { total: 0, success: 0, failed: 0, warning: 0 };
  const configItems = Object.values(config) as Array<{ name: string; isConfigured: boolean; description?: string }>;
  const configuredCount = configItems.filter((item) => item.isConfigured).length;
  const progressPercent = configItems.length ? Math.round((configuredCount / configItems.length) * 100) : 0;

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-zinc-50 font-sans">
      <div className="z-10 flex shrink-0 flex-col gap-4 border-b border-zinc-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-extrabold text-zinc-950 sm:text-2xl">
            <Settings className="size-6 text-emerald-600" />
            System Status Dashboard
          </h1>
          <p className="mt-1 text-sm font-medium text-zinc-500">ตรวจสอบ Webhook, API keys, logs และงานสรุปรายวัน</p>
        </div>
        <button
          onClick={loadData}
          disabled={isActionLoading || isLoading}
          className="flex items-center gap-2 self-start rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatusCard
            icon={Database}
            title="MySQL Database"
            ok={Boolean(statusData?.dbConnected)}
            value={statusData?.dbConnected ? "Connected" : "Connection error"}
            description={statusData?.dbConnected ? "Database is active" : statusData?.dbError || "ตรวจสอบ DATABASE_URL"}
          />
          <StatusCard
            icon={Activity}
            title="Webhook Health"
            ok={webhookStats.total > 0 && webhookStats.failed === 0}
            value={webhookStats.total > 0 ? `${webhookStats.total} requests` : "No requests"}
            description={webhookStats.failed > 0 ? `พบข้อผิดพลาด ${webhookStats.failed} รายการล่าสุด` : "สถานะ webhook ปกติ"}
          />
          <StatusCard
            icon={Sparkles}
            title="Gemini AI Service"
            ok={Boolean(config.geminiApiKey?.isConfigured)}
            value={config.geminiApiKey?.isConfigured ? "Configured" : "Missing API key"}
            description={config.geminiApiKey?.isConfigured ? "พร้อมใช้งาน" : "กรุณาตั้งค่า GEMINI_API_KEY"}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex gap-2 overflow-x-auto border-b border-zinc-200 bg-zinc-50/60 px-4 pt-3">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-8">
            {activeTab === "env" && (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <form onSubmit={handleSaveSettings} className="space-y-6 lg:col-span-8">
                  <div>
                    <h3 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                      <Lock className="size-5 text-emerald-600" />
                      API Settings
                    </h3>
                    <p className="mt-1 text-sm font-medium text-zinc-500">อัปเดต secret ที่ใช้เชื่อมต่อ Gemini และ LINE</p>
                  </div>

                  <SecretInput
                    label="GEMINI_API_KEY"
                    value={geminiApiKeyInput}
                    onChange={setGeminiApiKeyInput}
                    configured={Boolean(config.geminiApiKey?.isConfigured)}
                  />
                  <SecretInput
                    label="LINE_CHANNEL_SECRET"
                    value={lineChannelSecretInput}
                    onChange={setLineChannelSecretInput}
                    configured={Boolean(config.lineChannelSecret?.isConfigured)}
                  />
                  <SecretInput
                    label="LINE_CHANNEL_ACCESS_TOKEN"
                    value={lineChannelAccessTokenInput}
                    onChange={setLineChannelAccessTokenInput}
                    configured={Boolean(config.lineChannelAccessToken?.isConfigured)}
                  />

                  <button
                    type="submit"
                    disabled={isSavingConfig || (!geminiApiKeyInput && !lineChannelSecretInput && !lineChannelAccessTokenInput)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/15 transition-all hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {isSavingConfig ? <RefreshCw className="size-4 animate-spin" /> : <Play className="size-4" />}
                    Save Config
                  </button>
                </form>

                <div className="space-y-6 lg:col-span-4">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">System Readiness</p>
                    <div className="mt-3 flex items-end justify-between">
                      <span className="text-2xl font-extrabold text-zinc-900">{progressPercent}%</span>
                      <span className="text-sm font-bold text-emerald-700">
                        {configuredCount}/{configItems.length} ready
                      </span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-100 p-0.5">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Environment Status</p>
                    <div className="mt-4 divide-y divide-zinc-100">
                      {configItems.map((item) => (
                        <div key={item.name} className="flex items-center justify-between gap-3 py-3">
                          <span className="truncate font-mono text-xs font-bold text-zinc-800">{item.name}</span>
                          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusBadge(item.isConfigured)}`}>
                            {item.isConfigured ? "พร้อม" : "ยังไม่ตั้งค่า"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "webhook" && (
              <div className="space-y-8">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                    <Activity className="size-5 text-emerald-600" />
                    LINE Webhook
                  </h3>
                  <p className="mt-1 text-sm font-medium text-zinc-500">สถิติ request ล่าสุดจาก LINE webhook</p>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <Metric label="Total" value={webhookStats.total} />
                  <Metric label="Success" value={webhookStats.success} className="text-emerald-600" />
                  <Metric label="Failed" value={webhookStats.failed} className="text-rose-600" />
                  <Metric label="Warning" value={webhookStats.warning} className="text-amber-500" />
                </div>

                <LogList logs={webhookLogs} emptyText="ยังไม่มี LINE webhook logs" onSelect={setSelectedLog} />
              </div>
            )}

            {activeTab === "logs" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                      <Terminal className="size-5 text-emerald-600" />
                      System Logs
                    </h3>
                    <p className="mt-1 text-sm font-medium text-zinc-500">ตรวจสอบเหตุการณ์ของระบบ, webhook และ cron</p>
                  </div>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isActionLoading || logs.length === 0}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-650 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                    Clear Logs
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={["all", "webhook", "ai_summary", "cron", "system"]} />
                  <FilterSelect label="Level" value={levelFilter} onChange={setLevelFilter} options={["all", "info", "warning", "error"]} />
                </div>

                <LogList logs={filteredLogs} emptyText="ไม่พบ logs ตามตัวกรองที่เลือก" onSelect={setSelectedLog} />
              </div>
            )}

            {activeTab === "cron" && (
              <div className="space-y-6">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-bold text-zinc-900">
                    <Clock className="size-5 text-emerald-600" />
                    Daily Summary Cron
                  </h3>
                  <p className="mt-1 text-sm font-medium text-zinc-500">รันงานสรุปบทสนทนาแบบ manual เมื่อต้องการทดสอบ</p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <p className="font-mono text-sm font-bold text-zinc-800">GET /api/cron/daily-summary?secret=[CRON_SECRET]</p>
                  <p className="mt-2 text-sm font-medium text-zinc-500">ใช้ endpoint นี้กับ Vercel Cron, cron-job.org หรือ GitHub Actions</p>
                </div>

                <button
                  onClick={handleTriggerSummary}
                  disabled={isActionLoading}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/10 transition-all hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isActionLoading ? <RefreshCw className="size-4 animate-spin" /> : <Play className="size-4" />}
                  Run Daily Summary
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-5">
              <div>
                <h3 className="text-base font-bold text-zinc-800">Log Details</h3>
                <p className="mt-1 text-xs text-zinc-400">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 text-xl font-bold text-zinc-550 hover:bg-zinc-100"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-4 border-b border-zinc-100 pb-4">
                <Detail label="Type" value={selectedLog.type} />
                <Detail label="Level" value={levelLabel(selectedLog.level)} />
                <Detail label="Time" value={new Date(selectedLog.timestamp).toLocaleString("th-TH")} />
              </div>
              <Detail label="Message" value={selectedLog.message} boxed />
              {selectedLog.details && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Payload / Stack Trace</p>
                  <pre className="min-h-[220px] overflow-x-auto whitespace-pre-wrap rounded-2xl border border-zinc-900 bg-zinc-950 p-5 font-mono text-xs leading-relaxed text-zinc-200">
                    {selectedLog.details}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
                <ShieldAlert className="size-8" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-zinc-900">ล้าง System Logs?</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-500">ข้อมูล logs ทั้งหมดจะถูกลบ และไม่สามารถย้อนกลับได้</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={executeClearLogs}
                className="flex-1 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/10 transition-all hover:bg-rose-500"
              >
                Clear Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusCard({
  icon: Icon,
  title,
  ok,
  value,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  ok: boolean;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border ${statusBadge(ok)}`}>
        <Icon className="size-7" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">{title}</p>
        <h3 className="mt-1 flex items-center gap-2 text-base font-extrabold text-zinc-800">
          <span className={`size-2 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-500"}`} />
          <span className="truncate">{value}</span>
        </h3>
        <p className="mt-1 truncate text-xs font-medium text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

function SecretInput({
  label,
  value,
  onChange,
  configured,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  configured: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-zinc-700">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={configured ? "ตั้งค่าแล้ว - กรอกใหม่เมื่อต้องการเปลี่ยน" : `กรอก ${label}`}
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm transition-all placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
      />
      <p className={`text-xs font-semibold ${configured ? "text-emerald-700" : "text-zinc-400"}`}>
        {configured ? "พร้อมใช้งาน" : "ยังไม่ได้ตั้งค่า"}
      </p>
    </div>
  );
}

function Metric({ label, value, className = "text-zinc-800" }: { label: string; value: number; className?: string }) {
  return (
    <div className="flex min-h-[105px] flex-col justify-between rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${className}`}>{value}</p>
    </div>
  );
}

function LogList({
  logs,
  emptyText,
  onSelect,
}: {
  logs: LogEntry[];
  emptyText: string;
  onSelect: (log: LogEntry) => void;
}) {
  if (logs.length === 0) {
    return <div className="rounded-2xl border border-dashed border-zinc-200 py-12 text-center text-sm font-semibold text-zinc-450">{emptyText}</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="hidden items-center border-b border-zinc-200 bg-zinc-50/60 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-400 md:flex">
        <div className="w-48">Timestamp</div>
        <div className="w-32">Type</div>
        <div className="w-28">Level</div>
        <div className="flex-1">Message</div>
        <div className="w-24 text-right">Action</div>
      </div>
      <div className="max-h-[480px] divide-y divide-zinc-200 overflow-y-auto">
        {logs.map((log) => (
          <div key={log.id} className="flex flex-col gap-3 px-5 py-4 text-sm text-zinc-650 transition-colors hover:bg-zinc-50/50 md:flex-row md:items-center">
            <div className="text-[12px] font-mono text-zinc-400 md:w-48">{new Date(log.timestamp).toLocaleString("th-TH")}</div>
            <div className="font-semibold uppercase tracking-wider text-xs md:w-32">{log.type}</div>
            <div className="font-bold text-xs uppercase tracking-wider md:w-28">
              <span className={`rounded-full border px-2 py-0.5 ${levelBadge(log.level)}`}>{levelLabel(log.level)}</span>
            </div>
            <div className="flex-1 break-words font-semibold text-zinc-800 md:truncate md:pr-6">{log.message}</div>
            <div className="shrink-0 md:w-24 md:text-right">
              {log.details ? (
                <button
                  onClick={() => onSelect(log)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-650 shadow-sm transition-all hover:border-emerald-500/20 hover:bg-white hover:text-emerald-600"
                >
                  รายละเอียด
                </button>
              ) : (
                <span className="text-xs italic text-zinc-350">ไม่มีรายละเอียด</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-2.5">
      <span className="text-sm font-bold text-zinc-400">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-700 shadow-sm focus:border-emerald-500/50 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Detail({ label, value, boxed = false }: { label: string; value: React.ReactNode; boxed?: boolean }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</p>
      <div className={`mt-1.5 text-sm font-semibold text-zinc-800 ${boxed ? "rounded-xl border border-zinc-200/50 bg-zinc-50 p-4 leading-relaxed" : ""}`}>
        {value}
      </div>
    </div>
  );
}

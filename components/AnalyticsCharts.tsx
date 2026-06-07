"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getSentimentTrend,
  getTopicDistribution,
  getActionItemStats,
  getMessageVolumeTrend,
  SentimentTrendPoint,
  TopicDistribution,
  ActionItemStats,
  MessageVolumeByDay,
} from "@/app/actions/analytics";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  PieChartIcon,
  CheckCircle2,
  BarChart3,
  Activity,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────

interface AnalyticsChartsProps {
  groupId: string;
}

type ChartTab = "sentiment" | "volume" | "topics" | "actions";

// ── Main Component ──────────────────────────────────────────────────────

export function AnalyticsCharts({ groupId }: AnalyticsChartsProps) {
  const [activeChart, setActiveChart] = useState<ChartTab>("sentiment");
  const [sentimentData, setSentimentData] = useState<SentimentTrendPoint[]>([]);
  const [topicData, setTopicData] = useState<TopicDistribution[]>([]);
  const [actionItemStats, setActionItemStats] = useState<ActionItemStats | null>(null);
  const [volumeData, setVolumeData] = useState<MessageVolumeByDay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (chart: ChartTab) => {
    setLoading(true);
    try {
      switch (chart) {
        case "sentiment": {
          const res = await getSentimentTrend(groupId);
          if (res.success && res.data) setSentimentData(res.data);
          break;
        }
        case "topics": {
          const res = await getTopicDistribution(groupId);
          if (res.success && res.data) setTopicData(res.data);
          break;
        }
        case "actions": {
          const res = await getActionItemStats(groupId);
          if (res.success && res.data) setActionItemStats(res.data);
          break;
        }
        case "volume": {
          const res = await getMessageVolumeTrend(groupId);
          if (res.success && res.data) setVolumeData(res.data);
          break;
        }
      }
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadData(activeChart);
  }, [activeChart, loadData]);

  const handleChartChange = (_: React.MouseEvent<HTMLElement>, newChart: ChartTab | null) => {
    if (newChart) setActiveChart(newChart);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e4e4e7",
        borderRadius: 4,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: "1px solid #f4f4f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <BarChart3 size={18} color="#71717a" />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#18181b" }}>
            การวิเคราะห์ข้อมูล
          </Typography>
        </Stack>

        <ToggleButtonGroup
          value={activeChart}
          exclusive
          onChange={handleChartChange}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              px: 2,
              py: 0.75,
              borderRadius: 2.5,
              fontSize: 12,
              fontWeight: 500,
              color: "#71717a",
              border: "1px solid #e4e4e7",
              textTransform: "none",
              "&.Mui-selected": {
                bgcolor: "#18181b",
                color: "#fff",
                borderColor: "#18181b",
                "&:hover": { bgcolor: "#27272a" },
              },
              "&:hover": { bgcolor: "#f4f4f5" },
            },
          }}
        >
          <ToggleButton value="sentiment">Sentiment</ToggleButton>
          <ToggleButton value="volume">Messages</ToggleButton>
          <ToggleButton value="topics">Topics</ToggleButton>
          <ToggleButton value="actions">Actions</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Chart Area */}
      <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: 340 }}>
        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <CircularProgress size={32} thickness={4} sx={{ color: "#a1a1aa" }} />
          </Box>
        ) : (
          <>
            {activeChart === "sentiment" && <SentimentTrendChart data={sentimentData} />}
            {activeChart === "volume" && <MessageVolumeChart data={volumeData} />}
            {activeChart === "topics" && <TopicPieChart data={topicData} />}
            {activeChart === "actions" && actionItemStats && (
              <ActionCompletionChart stats={actionItemStats} />
            )}
          </>
        )}
      </Box>
    </Paper>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function SentimentTrendChart({ data }: { data: SentimentTrendPoint[] }) {
  if (data.length === 0) {
    return <EmptyState icon={Activity} message="ยังไม่มีข้อมูล Sentiment ย้อนหลัง" hint="ข้อมูลจะปรากฏเมื่อมีการทำ Daily Summary อย่างน้อย 1 ครั้ง" />;
  }

  const sentimentColor = (score: number) => {
    if (score >= 70) return "#059669";
    if (score >= 50) return "#0284c7";
    if (score >= 30) return "#d97706";
    return "#e11d48";
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload as SentimentTrendPoint;
      return (
        <Box
          sx={{
            bgcolor: "#fff",
            border: "1px solid #e4e4e7",
            borderRadius: 2,
            p: 1.5,
            boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#18181b", mb: 0.5 }}>
            {d.label}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "#71717a" }}>
            Sentiment: {d.sentimentScore}%
          </Typography>
          <Typography sx={{ fontSize: 11, color: "#71717a" }}>
            ข้อความ: {d.messagesCount}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const avgScore = Math.round(data.reduce((s, d) => s + d.sentimentScore, 0) / data.length);
  const latestScore = data[data.length - 1]?.sentimentScore ?? avgScore;
  const trendUp = latestScore >= avgScore;

  return (
    <Stack spacing={3}>
      {/* Trend indicator */}
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {trendUp ? <TrendingUp size={16} color="#059669" /> : <TrendingDown size={16} color="#e11d48" />}
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#52525b" }}>
            คะแนนเฉลี่ย {avgScore}% — แนวโน้ม{trendUp ? "ดีขึ้น" : "ลดลง"}
          </Typography>
        </Box>
      </Stack>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            axisLine={{ stroke: "#e4e4e7" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="messagesCount"
            fill="#f4f4f5"
            radius={[4, 4, 0, 0]}
            barSize={20}
            yAxisId="right"
          />
          <Line
            type="monotone"
            dataKey="sentimentScore"
            stroke="#4f46e5"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 5, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Stack>
  );
}

function MessageVolumeChart({ data }: { data: MessageVolumeByDay[] }) {
  if (data.length === 0) {
    return <EmptyState icon={Activity} message="ยังไม่มีข้อมูลข้อความย้อนหลัง" hint="ข้อมูลจะปรากฏเมื่อมีการทำ Daily Summary อย่างน้อย 1 ครั้ง" />;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ bgcolor: "#fff", border: "1px solid #e4e4e7", borderRadius: 2, p: 1.5, boxShadow: "0 8px 20px rgba(0,0,0,0.06)" }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>{label}</Typography>
          <Typography sx={{ fontSize: 11, color: "#71717a" }}>{payload[0].value} ข้อความ</Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={{ stroke: "#e4e4e7" }} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TopicPieChart({ data }: { data: TopicDistribution[] }) {
  if (data.length === 0) {
    return <EmptyState icon={PieChartIcon} message="ยังไม่มีข้อมูล Topics" hint="Topics จะถูกสร้างจากการทำ AI Summary หรือเพิ่มเองจาก Tab ประเด็นสำคัญ" />;
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.08) return null;

    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderLegend = ({ payload }: any) => (
    <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", justifyContent: "center", mt: 2 }}>
      {payload.map((entry: any, idx: number) => (
        <Stack key={idx} direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: entry.color }} />
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#52525b" }}>
            {entry.value} ({data.find(d => d.label === entry.value)?.count ?? 0})
          </Typography>
        </Stack>
      ))}
    </Stack>
  );

  return (
    <Stack spacing={1} sx={{ alignItems: "center" }}>
      <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#71717a", mb: 1 }}>
        หัวข้อทั้งหมด {total} รายการ แยกตามหมวดหมู่
      </Typography>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={90}
            innerRadius={40}
            dataKey="count"
            nameKey="label"
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} stroke="#fff" strokeWidth={2} />
            ))}
          </Pie>
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </Stack>
  );
}

function ActionCompletionChart({ stats }: { stats: ActionItemStats }) {
  const radialData = [
    { name: "เสร็จแล้ว", value: stats.completionRate, fill: "#059669" },
    { name: "คงเหลือ", value: 100 - stats.completionRate, fill: "#f4f4f5" },
  ];

  return (
    <Stack spacing={3} sx={{ alignItems: "center" }}>
      <Stack direction="row" spacing={4} sx={{ width: "100%", justifyContent: "center", flexWrap: "wrap" }}>
        <MetricBadge label="งานทั้งหมด" value={stats.total} color="#18181b" />
        <MetricBadge label="เสร็จแล้ว" value={stats.completed} color="#059669" />
        <MetricBadge label="ค้างอยู่" value={stats.pending} color="#d97706" />
      </Stack>

      <ResponsiveContainer width="100%" height={220}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="50%"
          outerRadius="90%"
          barSize={16}
          data={radialData}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar background={{ fill: "#f4f4f5" }} dataKey="value" cornerRadius={999}>
            {radialData.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </RadialBar>
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: 22, fontWeight: 700, fill: "#059669" }}
          >
            {stats.completionRate}%
          </text>
        </RadialBarChart>
      </ResponsiveContainer>

      <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#71717a", textAlign: "center" }}>
        อัตราความสำเร็จของงานที่ได้รับมอบหมาย
      </Typography>
    </Stack>
  );
}

function MetricBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box sx={{ textAlign: "center", minWidth: 80 }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</Typography>
      <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#a1a1aa", mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}

function EmptyState({
  icon: Icon,
  message,
  hint,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  message: string;
  hint: string;
}) {
  return (
    <Stack spacing={1.5} sx={{ py: 6, alignItems: "center", textAlign: "center", color: "#d4d4d8" }}>
      <Icon size={40} color="#d4d4d8" />
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#a1a1aa" }}>{message}</Typography>
      <Typography sx={{ fontSize: 11, color: "#d4d4d8", maxWidth: 260 }}>{hint}</Typography>
    </Stack>
  );
}
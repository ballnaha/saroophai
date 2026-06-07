"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export type SentimentTrendPoint = {
  date: string;
  label: string;
  sentimentScore: number;
  sentiment: string;
  messagesCount: number;
};

export type TopicDistribution = {
  category: string;
  label: string;
  count: number;
  fill: string;
};

export type ActionItemStats = {
  pending: number;
  completed: number;
  total: number;
  completionRate: number;
};

export type MessageVolumeByDay = {
  date: string;
  label: string;
  count: number;
};

// ── Category color mapping ──────────────────────────────────────────────

const categoryColors: Record<string, string> = {
  urgent: "#e11d48",
  work: "#4f46e5",
  finance: "#d97706",
  social: "#9333ea",
  general: "#52525b",
};

const categoryLabels: Record<string, string> = {
  urgent: "ด่วน",
  work: "งาน",
  finance: "การเงิน",
  social: "สังคม",
  general: "ทั่วไป",
};

// ── Sentiment Trend (last 30 days from DailySummary) ────────────────────

export async function getSentimentTrend(groupId: string): Promise<{
  success: boolean;
  data?: SentimentTrendPoint[];
  error?: string;
}> {
  try {
    await requireAdmin();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const summaries = await prisma.dailySummary.findMany({
      where: {
        groupId,
        summaryDate: { gte: thirtyDaysAgo },
      },
      orderBy: { summaryDate: "asc" },
      select: {
        summaryDate: true,
        sentiment: true,
        sentimentScore: true,
        messagesCount: true,
      },
    });

    const data: SentimentTrendPoint[] = summaries.map((s) => {
      const label = s.summaryDate.toLocaleDateString("th-TH", {
        timeZone: "Asia/Bangkok",
        month: "short",
        day: "numeric",
      });

      return {
        date: s.summaryDate.toISOString().slice(0, 10),
        label,
        sentimentScore: s.sentimentScore,
        sentiment: s.sentiment,
        messagesCount: s.messagesCount,
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch sentiment trend:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load sentiment trend",
    };
  }
}

// ── Topic Distribution (from current topics of a group) ─────────────────

export async function getTopicDistribution(groupId: string): Promise<{
  success: boolean;
  data?: TopicDistribution[];
  error?: string;
}> {
  try {
    await requireAdmin();

    const topics = await prisma.topic.findMany({
      where: { groupId },
      select: { category: true },
    });

    const countByCategory = new Map<string, number>();
    for (const t of topics) {
      countByCategory.set(t.category, (countByCategory.get(t.category) ?? 0) + 1);
    }

    const allCategories = ["urgent", "work", "finance", "social", "general"];
    const data: TopicDistribution[] = allCategories
      .map((cat) => ({
        category: cat,
        label: categoryLabels[cat] ?? cat,
        count: countByCategory.get(cat) ?? 0,
        fill: categoryColors[cat] ?? "#52525b",
      }))
      .filter((d) => d.count > 0);

    return { success: true, data: data.length > 0 ? data : [{ category: "general", label: "ทั่วไป", count: 1, fill: "#52525b" }] };
  } catch (error) {
    console.error("Failed to fetch topic distribution:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load topic distribution",
    };
  }
}

// ── Action Item Completion Stats ────────────────────────────────────────

export async function getActionItemStats(groupId: string): Promise<{
  success: boolean;
  data?: ActionItemStats;
  error?: string;
}> {
  try {
    await requireAdmin();

    const items = await prisma.actionItem.findMany({
      where: { groupId },
      select: { status: true },
    });

    const pending = items.filter((i) => i.status === "pending").length;
    const completed = items.filter((i) => i.status === "completed").length;
    const total = items.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      success: true,
      data: { pending, completed, total, completionRate },
    };
  } catch (error) {
    console.error("Failed to fetch action item stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load action item stats",
    };
  }
}

// ── Message Volume by Day (last 14 days from DailySummary) ──────────────

export async function getMessageVolumeTrend(groupId: string): Promise<{
  success: boolean;
  data?: MessageVolumeByDay[];
  error?: string;
}> {
  try {
    await requireAdmin();

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const summaries = await prisma.dailySummary.findMany({
      where: {
        groupId,
        summaryDate: { gte: fourteenDaysAgo },
      },
      orderBy: { summaryDate: "asc" },
      select: {
        summaryDate: true,
        messagesCount: true,
      },
    });

    const data: MessageVolumeByDay[] = summaries.map((s) => ({
      date: s.summaryDate.toISOString().slice(0, 10),
      label: s.summaryDate.toLocaleDateString("th-TH", {
        timeZone: "Asia/Bangkok",
        month: "short",
        day: "numeric",
      }),
      count: s.messagesCount,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch message volume trend:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load message volume trend",
    };
  }
}
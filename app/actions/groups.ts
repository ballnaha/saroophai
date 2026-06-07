"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

const BANGKOK_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

function formatBangkokDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function getBangkokDayRange(dateStr: string): { gte: Date; lte: Date } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const bangkokMidnightUtcMs = Date.UTC(year, month - 1, day) - BANGKOK_UTC_OFFSET_MS;

  return {
    gte: new Date(bangkokMidnightUtcMs),
    lte: new Date(bangkokMidnightUtcMs + 24 * 60 * 60 * 1000 - 1),
  };
}

function formatBangkokDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatLastSynced(lastSyncedAt: Date | null, fallback: string): string {
  if (!lastSyncedAt) {
    return fallback || "ยังไม่เคยซิงค์ข้อมูล";
  }

  const diffMs = Date.now() - lastSyncedAt.getTime();
  if (diffMs < 0) return "เมื่อสักครู่";

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return "เมื่อสักครู่";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

  return lastSyncedAt.toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export async function getLineGroups() {
  try {
    await requireAdmin();

    const dbGroups = await prisma.lineGroup.findMany({
      include: {
        contributors: true,
        actionItems: {
          orderBy: {
            status: "desc",
          },
        },
        topics: true,
        attachments: {
          orderBy: {
            messageTimestamp: "desc",
          },
        },
      },
      orderBy: {
        id: "asc"
      }
    });

    // Map Prisma models to our frontend interface (handling JSON casts and optional strings)
    const mappedGroups = dbGroups.map((g) => ({
      id: g.id,
      name: g.name,
      avatarColor: g.avatarColor,
      unreadCount: g.unreadCount,
      lastActive: g.lastActive,
      membersCount: g.membersCount,
      syncStatus: g.syncStatus as 'idle' | 'syncing' | 'completed' | 'failed',
      syncError: g.syncError || undefined,
      lastSynced: formatLastSynced(g.lastSyncedAt, g.lastSynced),
      lastSyncedAt: g.lastSyncedAt?.toISOString(),
      groupImageUrl: g.groupImageUrl || undefined,
      stats: {
        messagesToday: g.messagesToday,
        messagesChange: g.messagesChange,
        activeContributorsCount: g.activeContributorsCount,
        sentiment: g.sentiment as 'Positive' | 'Neutral' | 'Mixed' | 'Negative',
        sentimentScore: g.sentimentScore,
      },
      contributors: g.contributors.map((c) => ({
        name: c.name,
        messagesCount: c.messagesCount,
        avatarColor: c.avatarColor,
        profileImageUrl: c.profileImageUrl || undefined,
      })),
      summary: {
        overall: g.summaryOverall || "",
        morning: g.summaryMorning || "",
        afternoon: g.summaryAfternoon || "",
        evening: g.summaryEvening || "",
      },
      actionItems: g.actionItems.map((a: { id: string; task: string; assignee: string; status: string; assignedDate?: Date | null; dueDate?: string | null }) => ({
        id: a.id,
        task: a.task,
        assignee: a.assignee,
        status: a.status as 'pending' | 'completed',
        assignedDate: a.assignedDate ? formatBangkokDisplayDate(a.assignedDate) : undefined,
        dueDate: a.dueDate || undefined,
      })),
      topics: g.topics.map((t: { id: number; name: string; category: string; relevance: number; keyPoints: unknown }) => ({
        id: t.id,
        name: t.name,
        category: t.category as 'urgent' | 'work' | 'finance' | 'social' | 'general',
        relevance: t.relevance,
        keyPoints: Array.isArray(t.keyPoints) ? (t.keyPoints as string[]) : [],
      })),
      hourlyActivity: (g.hourlyActivity as number[]) || Array(24).fill(0),
      rawChat: g.rawChat,
      attachments: g.attachments.map((attachment) => ({
        id: attachment.id,
        groupId: attachment.groupId,
        userId: attachment.userId || undefined,
        senderName: attachment.senderName,
        messageType: attachment.messageType,
        contentProviderType: attachment.contentProviderType || undefined,
        filePath: attachment.filePath || undefined,
        originalContentUrl: attachment.originalContentUrl || undefined,
        previewImageUrl: attachment.previewImageUrl || undefined,
        mimeType: attachment.mimeType || undefined,
        fileSize: attachment.fileSize || undefined,
        messageTimestamp: attachment.messageTimestamp.toISOString(),
        createdAt: attachment.createdAt.toISOString(),
      })),
    }));

    return { success: true, data: mappedGroups };
  } catch (error) {
    console.error("Failed to fetch line groups:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load database records" };
  }
}

export async function toggleActionItemDb(itemId: string, status: "pending" | "completed") {
  try {
    await requireAdmin();

    const updated = await prisma.actionItem.update({
      where: { id: itemId },
      data: { status },
    });
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to toggle action item:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function createActionItemDb(data: {
  groupId: string;
  task: string;
  assignee: string;
  dueDate?: string;
}) {
  try {
    await requireAdmin();

    const task = data.task.trim();
    const assignee = data.assignee.trim();
    const dueDate = data.dueDate?.trim();

    if (!task) {
      return { success: false, error: "กรุณาระบุเรื่องที่ต้องทำ" };
    }

    if (!assignee) {
      return { success: false, error: "กรุณาเลือกผู้รับผิดชอบ" };
    }

    const created = await prisma.actionItem.create({
      data: {
        id: `act_manual_${data.groupId}_${Date.now()}`,
        groupId: data.groupId,
        task,
        assignee,
        status: "pending",
        assignedDate: new Date(),
        dueDate: dueDate || null,
      },
    });

    return { success: true, data: created };
  } catch (error) {
    console.error("Failed to create action item:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateActionItemDb(itemId: string, data: {
  task: string;
  assignee: string;
  dueDate?: string;
}) {
  try {
    await requireAdmin();

    const task = data.task.trim();
    const assignee = data.assignee.trim();
    const dueDate = data.dueDate?.trim();

    if (!task) {
      return { success: false, error: "กรุณาระบุเรื่องที่ต้องทำ" };
    }

    if (!assignee) {
      return { success: false, error: "กรุณาเลือกผู้รับผิดชอบ" };
    }

    const updated = await prisma.actionItem.update({
      where: { id: itemId },
      data: {
        task,
        assignee,
        dueDate: dueDate || null,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update action item:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getSummaryHistoryDates(groupId: string) {
  try {
    await requireAdmin();
    const summaries = await prisma.dailySummary.findMany({
      where: { groupId },
      select: { summaryDate: true },
      orderBy: { summaryDate: "desc" },
    });

    const dates = summaries.map((s) => {
      const dateStr = formatBangkokDateKey(s.summaryDate);
      const label = s.summaryDate.toLocaleDateString("th-TH", {
        timeZone: "Asia/Bangkok",
        dateStyle: "medium",
      });

      return { dateStr, label };
    });

    return { success: true, data: dates };
  } catch (error) {
    console.error("Failed to fetch summary dates:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load history dates" };
  }
}

export async function getSummaryByDate(groupId: string, dateStr: string) {
  try {
    await requireAdmin();

    const { gte, lte } = getBangkokDayRange(dateStr);

    const summary = await prisma.dailySummary.findFirst({
      where: {
        groupId,
        summaryDate: {
          gte,
          lte,
        },
      },
    });

    if (!summary) {
      return { success: false, error: "ไม่พบข้อมูลสรุปของวันที่เลือก" };
    }

    const topics = Array.isArray(summary.topics) ? summary.topics : [];
    const actionItems = Array.isArray(summary.actionItems) ? summary.actionItems : [];

    return {
      success: true,
      data: {
        id: summary.id,
        groupId: summary.groupId,
        summaryDate: summary.summaryDate.toISOString(),
        summary: {
          overall: summary.summaryOverall,
          morning: summary.summaryMorning,
          afternoon: summary.summaryAfternoon,
          evening: summary.summaryEvening,
        },
        stats: {
          messagesToday: summary.messagesCount,
          activeContributorsCount: summary.activeContributorsCount,
          sentiment: summary.sentiment,
          sentimentScore: summary.sentimentScore,
        },
        topics,
        actionItems,
      },
    };
  } catch (error) {
    console.error("Failed to fetch summary by date:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load summary details" };
  }
}

export async function deleteActionItemDb(itemId: string) {
  try {
    await requireAdmin();

    const deleted = await prisma.actionItem.delete({
      where: { id: itemId },
    });
    return { success: true, data: deleted };
  } catch (error) {
    console.error("Failed to delete action item:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function createTopicDb(data: {
  groupId: string;
  name: string;
  category: string;
  relevance: number;
  keyPoints: string[];
}) {
  try {
    await requireAdmin();

    const name = data.name.trim();
    const category = data.category.trim();
    const relevance = Math.max(0, Math.min(100, data.relevance));

    if (!name) {
      return { success: false, error: "กรุณาระบุหัวข้อหลัก" };
    }

    const created = await prisma.topic.create({
      data: {
        groupId: data.groupId,
        name,
        category,
        relevance,
        keyPoints: data.keyPoints,
      },
    });

    return { success: true, data: created };
  } catch (error) {
    console.error("Failed to create topic:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateTopicDb(topicId: number, data: {
  name: string;
  category: string;
  relevance: number;
  keyPoints: string[];
}) {
  try {
    await requireAdmin();

    const name = data.name.trim();
    const category = data.category.trim();
    const relevance = Math.max(0, Math.min(100, data.relevance));

    if (!name) {
      return { success: false, error: "กรุณาระบุหัวข้อหลัก" };
    }

    const updated = await prisma.topic.update({
      where: { id: topicId },
      data: {
        name,
        category,
        relevance,
        keyPoints: data.keyPoints,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update topic:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteTopicDb(topicId: number) {
  try {
    await requireAdmin();

    const deleted = await prisma.topic.delete({
      where: { id: topicId },
    });
    return { success: true, data: deleted };
  } catch (error) {
    console.error("Failed to delete topic:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

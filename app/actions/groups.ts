"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/authz";

export async function getLineGroups() {
  try {
    await requireAdmin();

    const dbGroups = await prisma.lineGroup.findMany({
      include: {
        contributors: true,
        actionItems: true,
        topics: true,
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
      lastSynced: g.lastSynced,
      stats: {
        messagesToday: g.messagesToday,
        messagesChange: g.messagesChange,
        activeContributorsCount: g.activeContributorsCount,
        sentiment: g.sentiment as 'Positive' | 'Neutral' | 'Mixed' | 'Negative',
        sentimentScore: g.sentimentScore,
      },
      contributors: g.contributors.map((c: { name: string; messagesCount: number; avatarColor: string }) => ({
        name: c.name,
        messagesCount: c.messagesCount,
        avatarColor: c.avatarColor,
      })),
      summary: {
        overall: g.summaryOverall || "",
        morning: g.summaryMorning || "",
        afternoon: g.summaryAfternoon || "",
        evening: g.summaryEvening || "",
      },
      actionItems: g.actionItems.map((a: { id: string; task: string; assignee: string; status: string; dueDate?: string | null }) => ({
        id: a.id,
        task: a.task,
        assignee: a.assignee,
        status: a.status as 'pending' | 'completed',
        dueDate: a.dueDate || undefined,
      })),
      topics: g.topics.map((t: { name: string; category: string; relevance: number; keyPoints: any }) => ({
        name: t.name,
        category: t.category as 'urgent' | 'work' | 'finance' | 'social' | 'general',
        relevance: t.relevance,
        keyPoints: (t.keyPoints as string[]) || [],
      })),
      hourlyActivity: (g.hourlyActivity as number[]) || Array(24).fill(0),
      rawChat: g.rawChat,
    }));

    return { success: true, data: mappedGroups };
  } catch (error: any) {
    console.error("Failed to fetch line groups:", error);
    return { success: false, error: error.message || "Failed to load database records" };
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
  } catch (error: any) {
    console.error("Failed to toggle action item:", error);
    return { success: false, error: error.message };
  }
}

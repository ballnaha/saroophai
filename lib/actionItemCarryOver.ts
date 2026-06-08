import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

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

function normalizeActionItemKey(task: string, assignee: string): string {
  return `${task.trim().replace(/\s+/g, " ").toLowerCase()}::${assignee.trim().replace(/\s+/g, " ").toLowerCase()}`;
}

function makeCarryOverActionItemId(groupId: string, task: string, assignee: string): string {
  const hash = createHash("sha1").update(`${groupId}:${normalizeActionItemKey(task, assignee)}`).digest("hex").slice(0, 16);
  return `act_carry_${groupId}_${hash}`;
}

function isPendingSummaryActionItem(value: unknown): value is { task: string; assignee: string; status?: string; dueDate?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const item = value as Record<string, unknown>;
  return (
    typeof item.task === "string" &&
    item.task.trim().length > 0 &&
    typeof item.assignee === "string" &&
    item.assignee.trim().length > 0 &&
    item.status !== "completed"
  );
}

function getTodayBangkokStart(): Date {
  const todayBangkok = formatBangkokDateKey(new Date());
  return getBangkokDayRange(todayBangkok).gte;
}

export async function carryOverPendingHistoryActionItems(prisma: PrismaClient): Promise<number> {
  const todayStart = getTodayBangkokStart();
  const [existingActionItems, historicalSummaries] = await Promise.all([
    prisma.actionItem.findMany({
      select: {
        groupId: true,
        task: true,
        assignee: true,
      },
    }),
    prisma.dailySummary.findMany({
      where: {
        summaryDate: {
          lt: todayStart,
        },
      },
      select: {
        groupId: true,
        summaryDate: true,
        actionItems: true,
      },
      orderBy: {
        summaryDate: "asc",
      },
    }),
  ]);

  const existingKeys = new Set(
    existingActionItems.map((item) => `${item.groupId}::${normalizeActionItemKey(item.task, item.assignee)}`)
  );
  const carriedItems: Array<{
    id: string;
    groupId: string;
    task: string;
    assignee: string;
    status: "pending";
    assignedDate: Date;
    dueDate: string | null;
  }> = [];

  for (const summary of historicalSummaries) {
    const actionItems = Array.isArray(summary.actionItems) ? summary.actionItems : [];

    for (const item of actionItems) {
      if (!isPendingSummaryActionItem(item)) continue;

      const task = item.task.trim();
      const assignee = item.assignee.trim();
      const key = `${summary.groupId}::${normalizeActionItemKey(task, assignee)}`;

      if (existingKeys.has(key)) continue;
      existingKeys.add(key);

      carriedItems.push({
        id: makeCarryOverActionItemId(summary.groupId, task, assignee),
        groupId: summary.groupId,
        task,
        assignee,
        status: "pending",
        assignedDate: summary.summaryDate,
        dueDate: item.dueDate ? `ค้างจาก ${formatBangkokDisplayDate(summary.summaryDate)} (${item.dueDate})` : `ค้างจาก ${formatBangkokDisplayDate(summary.summaryDate)}`,
      });
    }
  }

  if (carriedItems.length === 0) return 0;

  const result = await prisma.actionItem.createMany({
    data: carriedItems,
    skipDuplicates: true,
  });

  return result.count;
}

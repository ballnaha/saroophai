"use server";

import prisma from "@/lib/prisma";
import { logToSystem } from "@/lib/logger";
import { summarizeChatCore } from "./summarize";
import { revalidatePath } from "next/cache";
import { getGeminiApiKey, getLineChannelSecret, getLineAccessToken } from "@/lib/settings";
import { encrypt } from "@/lib/encryption";
import { requireAdmin } from "@/lib/authz";

function isConfigured(value: string | undefined, placeholder: string): boolean {
  return Boolean(value && value !== placeholder && value.trim() !== "");
}

export async function getSystemStatus() {
  await requireAdmin();

  // 1. Check DB Connection
  let dbConnected = false;
  let dbError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (err: any) {
    dbError = err?.message || String(err);
  }

  const geminiKey = await getGeminiApiKey();
  const lineSecret = await getLineChannelSecret();
  const lineAccessToken = await getLineAccessToken();

  // 2. Check Env Configurations
  const config = {
    geminiApiKey: {
      name: "GEMINI_API_KEY",
      isConfigured: isConfigured(geminiKey, "YOUR_GEMINI_API_KEY_HERE"),
      description: "คีย์สำหรับวิเคราะห์และสรุปบทสนทนาด้วย AI (Gemini 2.5)",
    },
    lineChannelSecret: {
      name: "LINE_CHANNEL_SECRET",
      isConfigured: isConfigured(lineSecret, "YOUR_LINE_CHANNEL_SECRET_HERE"),
      description: "คีย์ลับของ LINE Channel เพื่อตรวจสอบลายเซ็นความปลอดภัย (x-line-signature)",
    },
    lineChannelAccessToken: {
      name: "LINE_CHANNEL_ACCESS_TOKEN",
      isConfigured: isConfigured(lineAccessToken, "YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE"),
      description: "โทเค็นการเข้าถึงข้อมูล LINE Messaging API สำหรับดึงชื่อกลุ่มแชทและโปรไฟล์สมาชิก",
    },
    databaseUrl: {
      name: "DATABASE_URL",
      isConfigured: Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== ""),
      description: "ที่อยู่การเชื่อมต่อฐานข้อมูล MySQL",
    },
    authSecret: {
      name: "AUTH_SECRET / NEXTAUTH_SECRET",
      isConfigured: Boolean(
        (process.env.AUTH_SECRET && process.env.AUTH_SECRET.trim() !== "") ||
        (process.env.NEXT_AUTH_SECRET && process.env.NEXT_AUTH_SECRET.trim() !== "") ||
        (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.trim() !== "")
      ),
      description: "คีย์สำหรับเข้ารหัสความปลอดภัย Session ของระบบล็อกอิน",
    },
  };

  // 3. Webhook Stats
  let totalWebhookCalls = 0;
  let successWebhookCalls = 0;
  let failedWebhookCalls = 0;
  let warningWebhookCalls = 0;
  let lastWebhookActive: Date | null = null;

  if (dbConnected) {
    try {
      const webhookLogs = await prisma.systemLog.findMany({
        where: { type: "webhook" },
        orderBy: { timestamp: "desc" },
      });

      totalWebhookCalls = webhookLogs.length;
      successWebhookCalls = webhookLogs.filter((l) => l.level === "info").length;
      failedWebhookCalls = webhookLogs.filter((l) => l.level === "error").length;
      warningWebhookCalls = webhookLogs.filter((l) => l.level === "warning").length;

      if (webhookLogs.length > 0) {
        lastWebhookActive = webhookLogs[0].timestamp;
      }
    } catch (err) {
      console.error("Failed to query webhook stats:", err);
    }
  }

  // 4. Summaries Stats
  let totalSummariesProcessed = 0;
  let failedSummariesCount = 0;
  if (dbConnected) {
    try {
      const groups = await prisma.lineGroup.findMany();
      totalSummariesProcessed = groups.length;
      failedSummariesCount = groups.filter((g) => g.syncStatus === "failed").length;
    } catch (err) {
      console.error("Failed to query summaries stats:", err);
    }
  }

  return {
    dbConnected,
    dbError,
    config,
    stats: {
      webhook: {
        total: totalWebhookCalls,
        success: successWebhookCalls,
        failed: failedWebhookCalls,
        warning: warningWebhookCalls,
        lastActive: lastWebhookActive,
      },
      summary: {
        totalGroups: totalSummariesProcessed,
        failedCount: failedSummariesCount,
      },
    },
  };
}

export async function getSystemLogs() {
  await requireAdmin();

  try {
    const logs = await prisma.systemLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
    });
    return { success: true, data: logs };
  } catch (error: any) {
    return { success: false, error: error?.message || String(error) };
  }
}

export async function clearSystemLogs() {
  const user = await requireAdmin();

  try {
    await prisma.systemLog.deleteMany({});
    await logToSystem(
      "system",
      "info",
      `System logs cleared by user ${user.name || user.email}`
    );
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || String(error) };
  }
}

export async function triggerDailySummaryJob() {
  const user = await requireAdmin();

  try {
    const groups = await prisma.lineGroup.findMany();
    let successCount = 0;
    let failCount = 0;
    const detailsList: string[] = [];

    await logToSystem(
      "cron",
      "info",
      `Manual Daily Summary Job triggered by ${user.name || user.email}`
    );

    for (const group of groups) {
      if (!group.rawChat || group.rawChat.trim() === "") {
        detailsList.push(`Group [${group.name}] skipped: No chat history logs.`);
        continue;
      }

      try {
        const result = await summarizeChatCore(group.id, group.rawChat);
        if (result.success) {
          successCount++;
          detailsList.push(`Group [${group.name}] summarized successfully.`);
        } else {
          failCount++;
          detailsList.push(`Group [${group.name}] summary failed: ${result.error}`);
        }
      } catch (err: any) {
        failCount++;
        detailsList.push(`Group [${group.name}] summary error: ${err?.message || err}`);
      }
    }

    const summaryMsg = `Manual Daily Summary completed: ${successCount} succeeded, ${failCount} failed.`;
    await logToSystem(
      "cron",
      failCount > 0 ? "warning" : "info",
      summaryMsg,
      detailsList.join("\n")
    );

    revalidatePath("/");
    return { success: true, message: summaryMsg };
  } catch (error: any) {
    await logToSystem(
      "cron",
      "error",
      `Manual Daily Summary Job failed: ${error?.message || error}`
    );
    return { success: false, error: error?.message || String(error) };
  }
}

export async function saveSystemSettings(data: {
  geminiApiKey?: string;
  lineChannelSecret?: string;
  lineChannelAccessToken?: string;
}) {
  const user = await requireAdmin();

  try {
    const updateData: any = {};
    if (data.geminiApiKey !== undefined) {
      updateData.geminiApiKeyEnc = encrypt(data.geminiApiKey);
    }
    if (data.lineChannelSecret !== undefined) {
      updateData.lineChannelSecretEnc = encrypt(data.lineChannelSecret);
    }
    if (data.lineChannelAccessToken !== undefined) {
      updateData.lineAccessTokenEnc = encrypt(data.lineChannelAccessToken);
    }

    await prisma.systemSetting.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        ...updateData,
      },
    });

    const updatedKeys = Object.keys(data).filter(
      (k) => data[k as keyof typeof data] && data[k as keyof typeof data] !== ""
    );

    await logToSystem(
      "system",
      "info",
      `System configurations updated by user ${user.name || user.email}`,
      `Updated config fields: ${updatedKeys.join(", ") || "none"}`
    );

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    await logToSystem(
      "system",
      "error",
      `Failed to update system configurations: ${error?.message || error}`
    );
    return { success: false, error: error?.message || String(error) };
  }
}

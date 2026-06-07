import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { logToSystem } from "@/lib/logger";
import { getLineChannelSecret, getLineAccessToken } from "@/lib/settings";

// Deterministic colors for new groups
const GROUP_COLORS = [
  "#10b981",
  "#f43f5e",
  "#3b82f6",
  "#f59e0b",
  "#a855f7",
  "#14b8a6",
  "#ec4899",
  "#6366f1"
];

// Deterministic colors for new contributors
const CONTRIBUTOR_COLORS = [
  "#6366f1",
  "#10b981",
  "#f43f5e",
  "#f59e0b",
  "#a855f7",
  "#14b8a6",
  "#0ea5e9",
  "#ec4899"
];

function getDeterministicGroupColor(groupId: string): string {
  let hash = 0;
  for (let i = 0; i < groupId.length; i++) {
    hash = groupId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % GROUP_COLORS.length;
  return GROUP_COLORS[colorIndex];
}

function getDeterministicContributorColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % CONTRIBUTOR_COLORS.length;
  return CONTRIBUTOR_COLORS[colorIndex];
}

type LineWebhookPayload = {
  events?: LineWebhookEvent[];
};

type LineWebhookEvent = {
  type?: string;
  timestamp?: number;
  source?: {
    type?: string;
    groupId?: string;
    userId?: string;
  };
  message?: {
    id?: string;
    type?: string;
    text?: string;
    contentProvider?: {
      type?: string;
      originalContentUrl?: string;
      previewImageUrl?: string;
    };
  };
};

function isConfiguredSecret(secret: string | undefined): secret is string {
  return Boolean(
    secret &&
      secret !== "YOUR_LINE_CHANNEL_SECRET_HERE" &&
      secret.trim() !== ""
  );
}

function isValidLineSignature(rawBody: string, signature: string, channelSecret: string): boolean {
  const hash = createHmac("sha256", channelSecret.trim())
    .update(rawBody)
    .digest("base64");
  const expected = Buffer.from(hash);
  const actual = Buffer.from(signature.trim());

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function fetchGroupName(groupId: string, accessToken: string): Promise<string> {
  if (!accessToken || accessToken === "YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE" || accessToken.trim() === "") {
    return `LINE Group ${groupId.slice(-4)}`;
  }
  try {
    const res = await fetch(`https://api.line.me/v2/bot/group/${groupId}/summary`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return data.groupName || `LINE Group ${groupId.slice(-4)}`;
    } else {
      console.warn(`Failed to fetch group summary. Status: ${res.status}`);
    }
  } catch (error) {
    console.error("Error fetching group summary:", error);
  }
  return `LINE Group ${groupId.slice(-4)}`;
}

async function fetchMembersCount(groupId: string, accessToken: string): Promise<number> {
  if (!accessToken || accessToken === "YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE" || accessToken.trim() === "") {
    return 2;
  }
  try {
    const res = await fetch(`https://api.line.me/v2/bot/group/${groupId}/members/count`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return typeof data.count === "number" ? data.count : 2;
    } else {
      console.warn(`Failed to fetch members count. Status: ${res.status}`);
    }
  } catch (error) {
    console.error("Error fetching group members count:", error);
  }
  return 2;
}

async function fetchMemberProfile(groupId: string, userId: string, accessToken: string): Promise<{ displayName: string; pictureUrl?: string }> {
  const fallbackName = `User_${userId.slice(-4)}`;
  if (!accessToken || accessToken === "YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE" || accessToken.trim() === "") {
    return { displayName: fallbackName };
  }
  try {
    const res = await fetch(`https://api.line.me/v2/bot/group/${groupId}/member/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        displayName: data.displayName || fallbackName,
        pictureUrl: typeof data.pictureUrl === "string" ? data.pictureUrl : undefined,
      };
    } else {
      console.warn(`Failed to fetch member profile. Status: ${res.status}`);
    }
  } catch (error) {
    console.error("Error fetching group member:", error);
  }
  return { displayName: fallbackName };
}

function extensionFromContentType(contentType: string | null): string {
  if (!contentType) return "jpg";
  const ct = contentType.toLowerCase();
  if (ct.includes("png")) return "png";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("mp4")) return "mp4";
  if (ct.includes("quicktime") || ct.includes("mov")) return "mov";
  if (ct.includes("webm")) return "webm";
  if (ct.includes("mpeg")) return "mpeg";
  return "bin";
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function saveLineMessageContent({
  accessToken,
  groupId,
  messageId,
}: {
  accessToken: string;
  groupId: string;
  messageId: string;
}): Promise<{ filePath: string; mimeType?: string; fileSize?: number } | null> {
  if (!accessToken || accessToken === "YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE" || accessToken.trim() === "") {
    return null;
  }

  try {
    const res = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
      },
    });

    if (!res.ok) {
      console.warn(`Failed to fetch LINE content. Status: ${res.status}`);
      return null;
    }

    const contentType = res.headers.get("content-type");
    const bytes = Buffer.from(await res.arrayBuffer());
    const extension = extensionFromContentType(contentType);
    const safeGroupId = safePathSegment(groupId);
    const safeMessageId = safePathSegment(messageId);
    const relativePath = `/uploads/line/${safeGroupId}/${safeMessageId}.${extension}`;
    const outputDir = path.join(process.cwd(), "public", "uploads", "line", safeGroupId);
    const outputPath = path.join(outputDir, `${safeMessageId}.${extension}`);

    await mkdir(outputDir, { recursive: true });
    await writeFile(outputPath, bytes);

    return {
      filePath: relativePath,
      mimeType: contentType || undefined,
      fileSize: bytes.length,
    };
  } catch (error) {
    console.error("Error saving LINE message content:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-line-signature");
    const channelSecret = await getLineChannelSecret();

    // 1. Verify Signature
    if (isConfiguredSecret(channelSecret)) {
      if (!signature) {
        console.error("Missing x-line-signature header");
        await logToSystem(
          "webhook",
          "error",
          "LINE webhook signature verification failed: Missing signature header",
          "No x-line-signature header was provided in request headers."
        );
        return new NextResponse("Missing signature", { status: 400 });
      }

      if (!isValidLineSignature(rawBody, signature, channelSecret)) {
        console.error(
          "LINE webhook signature validation failed. Check that LINE_CHANNEL_SECRET matches the channel secret in the LINE Developers console, then restart the Next.js server."
        );
        await logToSystem(
          "webhook",
          "error",
          "LINE webhook signature verification failed: Signature mismatch",
          `Check that LINE_CHANNEL_SECRET environment variable is correct.\nSignature provided: ${signature}`
        );
        return new NextResponse("Invalid signature", { status: 401 });
      }
    } else {
      console.warn("LINE_CHANNEL_SECRET is not configured or using placeholder. Signature verification bypassed.");
      await logToSystem(
        "webhook",
        "warning",
        "LINE Webhook signature verification bypassed",
        "LINE_CHANNEL_SECRET is not configured or using placeholder. Allowing request without verification."
      );
    }

    // 2. Parse Events
    let payload: LineWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as LineWebhookPayload;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Failed to parse body JSON:", err);
      await logToSystem(
        "webhook",
        "error",
        "Failed to parse body JSON in Webhook",
        errorMessage
      );
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    const events = Array.isArray(payload.events) ? payload.events : [];
    const accessToken = await getLineAccessToken();
    let processedCount = 0;

    for (const event of events) {
      // We only process message events from groups
      if (event.type === "message" && event.source?.type === "group") {
        const groupId = event.source.groupId;
        const userId = event.source.userId;

        if (!groupId) continue;

        const messageId = event.message?.id;
        const messageType = event.message?.type || "unknown";
        const contentProvider = event.message?.contentProvider;

        // Determine message text representation
        let messageText = "";
        if (event.message?.type === "text") {
          messageText = event.message.text || "";
        } else if (event.message?.type === "sticker") {
          messageText = "[ส่งสติ๊กเกอร์]";
        } else if (event.message?.type === "image") {
          messageText = "[ส่งรูปภาพ]";
        } else if (event.message?.type === "video") {
          messageText = "[ส่งวิดีโอ]";
        } else if (event.message?.type === "audio") {
          messageText = "[ส่งข้อความเสียง]";
        } else if (event.message?.type === "file") {
          messageText = "[ส่งไฟล์]";
        } else {
          messageText = `[ส่งข้อความประเภท ${event.message?.type || "unknown"}]`;
        }

        // Get Thailand time from timestamp (epoch ms)
        const timestampMs = event.timestamp || Date.now();
        const date = new Date(timestampMs);
        const timeString = date.toLocaleTimeString("en-US", {
          timeZone: "Asia/Bangkok",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        // Determine current hour index (0-23)
        const hourString = date.toLocaleTimeString("en-US", {
          timeZone: "Asia/Bangkok",
          hour: "2-digit",
          hour12: false,
        });
        const hourIdx = parseInt(hourString, 10);

        // Fetch user display name and profile image
        const senderProfile = userId
          ? await fetchMemberProfile(groupId, userId, accessToken)
          : { displayName: "System" };
        const senderName = senderProfile.displayName;

        // Query group from DB
        const dbGroup = await prisma.lineGroup.findUnique({
          where: { id: groupId }
        });

        const groupName = dbGroup ? dbGroup.name : await fetchGroupName(groupId, accessToken);
        const membersCount = dbGroup ? dbGroup.membersCount : await fetchMembersCount(groupId, accessToken);
        const avatarColor = dbGroup ? dbGroup.avatarColor : getDeterministicGroupColor(groupId);

        const formattedLine = `[${timeString}] ${senderName}: ${messageText}`;
        const updatedRawChat = dbGroup && dbGroup.rawChat && dbGroup.rawChat.trim() !== ""
          ? `${dbGroup.rawChat}\n${formattedLine}`
          : `[LINE Chat Log] ${groupName}\n${formattedLine}`;

        // Update hourly activity array
        let updatedHourlyActivity = Array(24).fill(0);
        if (dbGroup && dbGroup.hourlyActivity) {
          try {
            updatedHourlyActivity = Array.isArray(dbGroup.hourlyActivity)
              ? [...(dbGroup.hourlyActivity as number[])]
              : Array(24).fill(0);
          } catch {
            // fallback
          }
        }
        if (hourIdx >= 0 && hourIdx < 24) {
          updatedHourlyActivity[hourIdx] += 1;
        }

        // Save LineGroup record
        if (dbGroup) {
          await prisma.lineGroup.update({
            where: { id: groupId },
            data: {
              rawChat: updatedRawChat,
              unreadCount: { increment: 1 },
              lastActive: timeString,
              hourlyActivity: updatedHourlyActivity,
            }
          });
        } else {
          await prisma.lineGroup.create({
            data: {
              id: groupId,
              name: groupName,
              avatarColor,
              unreadCount: 1,
              lastActive: timeString,
              membersCount,
              syncStatus: "idle",
              lastSynced: "ยังไม่เคยซิงค์ข้อมูลวันนี้",
              lastSyncedAt: null,
              rawChat: updatedRawChat,
              hourlyActivity: updatedHourlyActivity,
              messagesToday: 1,
              messagesChange: 0,
              activeContributorsCount: 1,
              sentiment: "Neutral",
              sentimentScore: 50,
            }
          });
        }

        if ((messageType === "image" || messageType === "video") && messageId) {
          const savedFile =
            contentProvider?.type === "external"
              ? null
              : await saveLineMessageContent({ accessToken, groupId, messageId });

          await prisma.lineMessageAttachment.upsert({
            where: { id: messageId },
            update: {
              groupId,
              userId,
              senderName,
              messageType,
              contentProviderType: contentProvider?.type,
              filePath: savedFile?.filePath,
              originalContentUrl: contentProvider?.originalContentUrl,
              previewImageUrl: contentProvider?.previewImageUrl,
              mimeType: savedFile?.mimeType,
              fileSize: savedFile?.fileSize,
              messageTimestamp: date,
            },
            create: {
              id: messageId,
              groupId,
              userId,
              senderName,
              messageType,
              contentProviderType: contentProvider?.type,
              filePath: savedFile?.filePath,
              originalContentUrl: contentProvider?.originalContentUrl,
              previewImageUrl: contentProvider?.previewImageUrl,
              mimeType: savedFile?.mimeType,
              fileSize: savedFile?.fileSize,
              messageTimestamp: date,
            },
          });
        }

        // Handle Contributor update or creation
        if (userId) {
          const contributor = await prisma.contributor.findFirst({
            where: {
              groupId,
              name: senderName
            }
          });

          if (contributor) {
            await prisma.contributor.update({
              where: { id: contributor.id },
              data: {
                messagesCount: { increment: 1 },
                ...(senderProfile.pictureUrl ? { profileImageUrl: senderProfile.pictureUrl } : {}),
              }
            });
          } else {
            const senderColor = getDeterministicContributorColor(senderName);
            await prisma.contributor.create({
              data: {
                groupId,
                name: senderName,
                messagesCount: 1,
                avatarColor: senderColor,
                profileImageUrl: senderProfile.pictureUrl,
              }
            });
          }

          // Update active contributors count on LineGroup
          const contributorsCount = await prisma.contributor.count({
            where: { groupId }
          });
          await prisma.lineGroup.update({
            where: { id: groupId },
            data: {
              activeContributorsCount: contributorsCount
            }
          });
        }
        processedCount++;
      }
    }

    if (events.length > 0) {
      await logToSystem(
        "webhook",
        "info",
        `Processed ${events.length} LINE webhook events successfully`,
        `Processed events count: ${processedCount}. Raw payload size: ${rawBody.length} bytes.`
      );
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    const stack = error instanceof Error ? error.stack : undefined;

    await logToSystem(
      "webhook",
      "error",
      `Webhook processing exception: ${message}`,
      stack
    );

    return new NextResponse(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

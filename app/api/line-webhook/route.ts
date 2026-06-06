import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import prisma from "@/lib/prisma";

// Deterministic colors for new groups
const GROUP_COLORS = [
  "bg-emerald-500 text-white",
  "bg-rose-500 text-white",
  "bg-blue-500 text-white",
  "bg-amber-500 text-white",
  "bg-purple-500 text-white",
  "bg-teal-500 text-white",
  "bg-pink-500 text-white",
  "bg-indigo-500 text-white"
];

// Deterministic colors for new contributors
const CONTRIBUTOR_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-pink-500"
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

async function fetchMemberName(groupId: string, userId: string, accessToken: string): Promise<string> {
  if (!accessToken || accessToken === "YOUR_LINE_CHANNEL_ACCESS_TOKEN_HERE" || accessToken.trim() === "") {
    return `User_${userId.slice(-4)}`;
  }
  try {
    const res = await fetch(`https://api.line.me/v2/bot/group/${groupId}/member/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return data.displayName || `User_${userId.slice(-4)}`;
    } else {
      console.warn(`Failed to fetch member profile. Status: ${res.status}`);
    }
  } catch (error) {
    console.error("Error fetching group member:", error);
  }
  return `User_${userId.slice(-4)}`;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-line-signature");
    const channelSecret = process.env.LINE_CHANNEL_SECRET;

    // 1. Verify Signature
    if (isConfiguredSecret(channelSecret)) {
      if (!signature) {
        console.error("Missing x-line-signature header");
        return new NextResponse("Missing signature", { status: 400 });
      }

      if (!isValidLineSignature(rawBody, signature, channelSecret)) {
        console.error(
          "LINE webhook signature validation failed. Check that LINE_CHANNEL_SECRET matches the channel secret in the LINE Developers console, then restart the Next.js server."
        );
        return new NextResponse("Invalid signature", { status: 401 });
      }
    } else {
      console.warn("LINE_CHANNEL_SECRET is not configured or using placeholder. Signature verification bypassed.");
    }

    // 2. Parse Events
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      console.error("Failed to parse body JSON:", err);
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    const events = payload.events || [];
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

    for (const event of events) {
      // We only process message events from groups
      if (event.type === "message" && event.source?.type === "group") {
        const groupId = event.source.groupId;
        const userId = event.source.userId;

        if (!groupId) continue;

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

        // Fetch user display name
        const senderName = userId 
          ? await fetchMemberName(groupId, userId, accessToken) 
          : "System";

        // Query group from DB
        const dbGroup = await prisma.lineGroup.findUnique({
          where: { id: groupId }
        });

        const groupName = dbGroup ? dbGroup.name : await fetchGroupName(groupId, accessToken);
        const membersCount = dbGroup ? dbGroup.membersCount : await fetchMembersCount(groupId, accessToken);
        const avatarColor = dbGroup ? dbGroup.avatarColor : getDeterministicGroupColor(groupId);

        const formattedLine = `[${timeString}] ${senderName}: ${messageText}`;
        const updatedRawChat = dbGroup
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
                messagesCount: { increment: 1 }
              }
            });
          } else {
            const senderColor = getDeterministicContributorColor(senderName);
            await prisma.contributor.create({
              data: {
                groupId,
                name: senderName,
                messagesCount: 1,
                avatarColor: senderColor
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
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";

    return new NextResponse(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { summarizeChatCore } from "@/app/actions/summarize";
import { logToSystem } from "@/lib/logger";
import { applyRateLimit, cronLimiter } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  // ── Rate Limiting ──────────────────────────────────────────────────────
  const rateLimitResult = await applyRateLimit(request, cronLimiter);
  if (rateLimitResult) return rateLimitResult;

  // 1. Authenticate Request
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const paramSecret = searchParams.get("secret");
  const authHeader = request.headers.get("authorization");
  const headerSecret = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  const providedSecret = paramSecret || headerSecret;

  if (cronSecret && cronSecret.trim() !== "") {
    if (providedSecret !== cronSecret) {
      await logToSystem(
        "cron",
        "error",
        "Unauthorized Cron call blocked",
        `A request to trigger daily summary cron was blocked due to invalid secret token.`
      );
      return new NextResponse("Unauthorized", { status: 401 });
    }
  } else {
    console.warn("CRON_SECRET environment variable is not defined. Cron job running without authentication protection.");
  }

  // 2. Perform the Daily Summary Loop
  try {
    const groups = await prisma.lineGroup.findMany();
    let successCount = 0;
    let failCount = 0;
    const detailsList: string[] = [];

    await logToSystem(
      "cron",
      "info",
      "Daily Summary Cron Job triggered"
    );

    for (const group of groups) {
      if (!group.rawChat || group.rawChat.trim() === "") {
        detailsList.push(`Group [${group.name}] skipped: No raw chat history.`);
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

    const summaryMsg = `Automated Daily Summary Cron completed: ${successCount} succeeded, ${failCount} failed.`;
    await logToSystem(
      "cron",
      failCount > 0 ? "warning" : "info",
      summaryMsg,
      detailsList.join("\n")
    );

    return NextResponse.json({
      success: true,
      message: summaryMsg,
      processed: {
        success: successCount,
        failed: failCount,
      }
    });
  } catch (error: any) {
    await logToSystem(
      "cron",
      "error",
      `Automated Daily Summary Cron failed: ${error?.message || error}`
    );
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

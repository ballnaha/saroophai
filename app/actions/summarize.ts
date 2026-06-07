"use server";

import { GoogleGenAI } from "@google/genai";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logToSystem } from "@/lib/logger";
import { getGeminiApiKey } from "@/lib/settings";
import { requireAdmin } from "@/lib/authz";

interface SummarizeResult {
  success: boolean;
  data?: SummaryPayload;
  error?: string;
}

type TopicCategory = "urgent" | "work" | "finance" | "social" | "general";
type Sentiment = "Positive" | "Neutral" | "Mixed" | "Negative";

type SummaryPayload = {
  stats: {
    messagesToday: number;
    messagesChange: number;
    activeContributorsCount: number;
    sentiment: Sentiment;
    sentimentScore: number;
  };
  summary: {
    overall: string;
    morning: string;
    afternoon: string;
    evening: string;
  };
  actionItems: Array<{
    task: string;
    assignee: string;
    dueDate?: string;
  }>;
  topics: Array<{
    name: string;
    category: TopicCategory;
    relevance: number;
    keyPoints: string[];
  }>;
  generatedLocally?: boolean;
};

type ParsedChatMessage = {
  hour: number;
  sender: string;
  text: string;
};

const NO_NEW_MESSAGES_ERROR = "ไม่มีข้อความใหม่ที่ต้องการสรุปข้อมูลในขณะนี้";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseChatMessages(rawChat: string): ParsedChatMessage[] {
  return rawChat
    .split("\n")
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^\[(\d{2}):(\d{2})\]\s*(.+)$/);
      if (!match) return null;

      const rest = match[3];
      const separatorIndex = rest.indexOf(":");
      if (separatorIndex < 0) return null;

      const sender = rest.slice(0, separatorIndex).trim();
      const text = rest.slice(separatorIndex + 1).trim();
      if (!sender || !text) return null;

      return {
        hour: Number(match[1]),
        sender,
        text,
      };
    })
    .filter((message): message is ParsedChatMessage => Boolean(message));
}

function makeBulletSummary(messages: ParsedChatMessage[], emptyLabel: string) {
  if (messages.length === 0) return `- ${emptyLabel}`;

  const samples = messages.slice(0, 3).map((message) => {
    const text = message.text.length > 110 ? `${message.text.slice(0, 107)}...` : message.text;
    return `- ${message.sender}: ${text}`;
  });

  if (messages.length > samples.length) {
    samples.push(`- มีข้อความเพิ่มเติมอีก ${messages.length - samples.length} รายการในช่วงเวลานี้`);
  }

  return samples.join("\n");
}

function detectCategory(text: string): TopicCategory {
  if (/(ด่วน|เร่ง|urgent|asap|บั๊ก|bug|error|ล่ม|เสีย|แก้)/i.test(text)) return "urgent";
  if (/(เงิน|ยอดขาย|ราคา|งบ|invoice|budget|sale|cost|finance)/i.test(text)) return "finance";
  if (/(ขอบคุณ|กิน|นัด|เจอ|ลา|เที่ยว|สุขสันต์|social)/i.test(text)) return "social";
  if (/(งาน|deploy|ระบบ|โปรเจกต์|project|design|test|qa|dev|meeting|report|dashboard)/i.test(text)) return "work";
  return "general";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizePayload(data: unknown): SummaryPayload {
  const source = isRecord(data) ? data : {};
  const stats = isRecord(source.stats) ? source.stats : {};
  const summary = isRecord(source.summary) ? source.summary : {};
  const sentimentValues: Sentiment[] = ["Positive", "Neutral", "Mixed", "Negative"];
  const sentiment =
    typeof stats.sentiment === "string" && sentimentValues.includes(stats.sentiment as Sentiment)
      ? (stats.sentiment as Sentiment)
      : "Neutral";
  const rawActionItems = Array.isArray(source.actionItems) ? source.actionItems : [];
  const rawTopics = Array.isArray(source.topics) ? source.topics : [];

  return {
    stats: {
      messagesToday: Number.isFinite(Number(stats.messagesToday)) ? Number(stats.messagesToday) : 0,
      messagesChange: Number.isFinite(Number(stats.messagesChange)) ? Number(stats.messagesChange) : 0,
      activeContributorsCount: Number.isFinite(Number(stats.activeContributorsCount)) ? Number(stats.activeContributorsCount) : 0,
      sentiment,
      sentimentScore: clamp(Number.isFinite(Number(stats.sentimentScore)) ? Number(stats.sentimentScore) : 50, 0, 100),
    },
    summary: {
      overall: String(summary.overall || "ไม่มีข้อมูลสรุป"),
      morning: String(summary.morning || "- ไม่มีข้อความช่วงเช้า"),
      afternoon: String(summary.afternoon || "- ไม่มีข้อความช่วงบ่าย"),
      evening: String(summary.evening || "- ไม่มีข้อความช่วงเย็น"),
    },
    actionItems: rawActionItems
      .filter(isRecord)
      .map((item) => ({
        task: String(item.task || "ตรวจสอบรายละเอียดเพิ่มเติม"),
        assignee: String(item.assignee || "ไม่ระบุ"),
        dueDate: item.dueDate ? String(item.dueDate) : undefined,
      })),
    topics: rawTopics
      .filter(isRecord)
      .map((topic) => {
        const category: TopicCategory =
          typeof topic.category === "string" && ["urgent", "work", "finance", "social", "general"].includes(topic.category)
            ? (topic.category as TopicCategory)
            : "general";
        return {
          name: String(topic.name || "ภาพรวมการสนทนา"),
          category,
          relevance: clamp(Number.isFinite(Number(topic.relevance)) ? Number(topic.relevance) : 70, 0, 100),
          keyPoints: Array.isArray(topic.keyPoints) ? topic.keyPoints.map((point) => String(point)) : [],
        };
      }),
    generatedLocally: Boolean(source.generatedLocally),
  };
}

function buildLocalSummary(rawChat: string): SummaryPayload {
  const messages = parseChatMessages(rawChat);
  const contributorCounts = new Map<string, number>();

  for (const message of messages) {
    contributorCounts.set(message.sender, (contributorCounts.get(message.sender) || 0) + 1);
  }

  const contributors = [...contributorCounts.entries()].sort((a, b) => b[1] - a[1]);
  const positiveHits = messages.filter((message) => /(ขอบคุณ|ดี|เรียบร้อย|สำเร็จ|ผ่าน|โอเค|เยี่ยม|ตกลง|พร้อม|success|done|ok)/i.test(message.text)).length;
  const negativeHits = messages.filter((message) => /(บั๊ก|เสีย|ล่ม|ผิดพลาด|ติดปัญหา|ไม่ผ่าน|ช้า|ด่วน|กังวล|fail|error|issue)/i.test(message.text)).length;
  const sentimentScore = clamp(55 + positiveHits * 7 - negativeHits * 8, 20, 90);
  const sentiment: Sentiment =
    sentimentScore >= 72 ? "Positive" :
    sentimentScore <= 38 ? "Negative" :
    positiveHits > 0 && negativeHits > 0 ? "Mixed" :
    "Neutral";

  const morningMessages = messages.filter((message) => message.hour < 12);
  const afternoonMessages = messages.filter((message) => message.hour >= 12 && message.hour < 18);
  const eveningMessages = messages.filter((message) => message.hour >= 18);
  const allText = messages.map((message) => message.text).join(" ");
  const category = detectCategory(allText);
  const topContributors = contributors.slice(0, 3).map(([name, count]) => `${name} (${count})`).join(", ") || "ไม่พบผู้สนทนาหลัก";

  const actionKeyword = /(ต้อง|ช่วย|ฝาก|รับไป|ทำ|แก้|ตรวจ|เตรียม|ส่ง|นัด|ติดตาม|deploy|review|test|สรุป)/i;
  const actionItems = messages
    .filter((message) => actionKeyword.test(message.text))
    .slice(0, 5)
    .map((message) => ({
      task: message.text.length > 160 ? `${message.text.slice(0, 157)}...` : message.text,
      assignee: message.sender || "ไม่ระบุ",
    }));

  const keyPoints = messages.slice(0, 4).map((message) => {
    const text = message.text.length > 120 ? `${message.text.slice(0, 117)}...` : message.text;
    return `${message.sender}: ${text}`;
  });

  return {
    generatedLocally: true,
    stats: {
      messagesToday: messages.length,
      messagesChange: 0,
      activeContributorsCount: contributorCounts.size,
      sentiment,
      sentimentScore,
    },
    summary: {
      overall: `ระบบสร้างสรุปอัตโนมัติจากข้อความ ${messages.length} รายการ โดยผู้สนทนาหลักคือ ${topContributors} ประเด็นโดยรวมอยู่ในหมวด ${category} และใช้เป็นข้อมูลเบื้องต้นได้เมื่อ Gemini API ยังไม่พร้อมใช้งาน`,
      morning: makeBulletSummary(morningMessages, "ไม่มีข้อความช่วงเช้า"),
      afternoon: makeBulletSummary(afternoonMessages, "ไม่มีข้อความช่วงบ่าย"),
      evening: makeBulletSummary(eveningMessages, "ไม่มีข้อความช่วงเย็น"),
    },
    actionItems,
    topics: [
      {
        name: category === "general" ? "ภาพรวมการสนทนา" : `ประเด็นหลัก: ${category}`,
        category,
        relevance: clamp(65 + messages.length * 2, 65, 95),
        keyPoints: keyPoints.length > 0 ? keyPoints : ["ไม่มีข้อความที่นำมาสรุปได้"],
      },
    ],
  };
}

async function saveSummaryPayload(groupId: string, payload: SummaryPayload) {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.lineGroup.update({
      where: { id: groupId },
      data: {
        syncStatus: "completed",
        lastSynced: "เมื่อสักครู่",
        lastSyncedAt: new Date(),
        unreadCount: 0,
        syncError: null,
        messagesToday: payload.stats.messagesToday,
        messagesChange: payload.stats.messagesChange,
        activeContributorsCount: payload.stats.activeContributorsCount,
        sentiment: payload.stats.sentiment,
        sentimentScore: payload.stats.sentimentScore,
        summaryOverall: payload.summary.overall,
        summaryMorning: payload.summary.morning,
        summaryAfternoon: payload.summary.afternoon,
        summaryEvening: payload.summary.evening,
      },
    });

    await tx.actionItem.deleteMany({ where: { groupId } });
    if (payload.actionItems.length > 0) {
      const now = Date.now();
      await tx.actionItem.createMany({
        data: payload.actionItems.map((item, idx) => ({
          id: `act_gen_${groupId}_${idx}_${now}`,
          groupId,
          task: item.task,
          assignee: item.assignee,
          status: "pending",
          dueDate: item.dueDate || null,
        })),
      });
    }

    await tx.topic.deleteMany({ where: { groupId } });
    if (payload.topics.length > 0) {
      await tx.topic.createMany({
        data: payload.topics.map((topic) => ({
          groupId,
          name: topic.name,
          category: topic.category,
          relevance: topic.relevance,
          keyPoints: topic.keyPoints,
        })),
      });
    }

    const dateInBangkokStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Bangkok" });
    const summaryDate = new Date(dateInBangkokStr);

    await tx.dailySummary.upsert({
      where: {
        groupId_summaryDate: {
          groupId,
          summaryDate,
        },
      },
      update: {
        summaryOverall: payload.summary.overall,
        summaryMorning: payload.summary.morning,
        summaryAfternoon: payload.summary.afternoon,
        summaryEvening: payload.summary.evening,
        messagesCount: payload.stats.messagesToday,
        activeContributorsCount: payload.stats.activeContributorsCount,
        sentiment: payload.stats.sentiment,
        sentimentScore: payload.stats.sentimentScore,
        topics: payload.topics as Prisma.InputJsonValue,
        actionItems: payload.actionItems as Prisma.InputJsonValue,
      },
      create: {
        groupId,
        summaryDate,
        summaryOverall: payload.summary.overall,
        summaryMorning: payload.summary.morning,
        summaryAfternoon: payload.summary.afternoon,
        summaryEvening: payload.summary.evening,
        messagesCount: payload.stats.messagesToday,
        activeContributorsCount: payload.stats.activeContributorsCount,
        sentiment: payload.stats.sentiment,
        sentimentScore: payload.stats.sentimentScore,
        topics: payload.topics as Prisma.InputJsonValue,
        actionItems: payload.actionItems as Prisma.InputJsonValue,
      },
    });
  });
}

async function saveLocalFallbackSummary(groupId: string, rawChat: string, reason: string): Promise<SummaryPayload> {
  const fallbackData = buildLocalSummary(rawChat);
  await saveSummaryPayload(groupId, fallbackData);

  await logToSystem(
    "ai_summary",
    "warning",
    `Local summary generated for group ${groupId}`,
    reason
  );

  return fallbackData;
}

export async function summarizeChat(groupId: string, rawChat: string): Promise<SummarizeResult> {
  try {
    await requireAdmin();
  } catch {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  return summarizeChatCore(groupId, rawChat);
}

export async function generateLocalSummary(groupId: string): Promise<SummarizeResult> {
  try {
    await requireAdmin();
  } catch {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const dbGroup = await prisma.lineGroup.findUnique({
    where: { id: groupId },
    select: { rawChat: true },
  });

  const rawChat = dbGroup?.rawChat || "";
  if (parseChatMessages(rawChat).length === 0) {
    return {
      success: false,
      error: NO_NEW_MESSAGES_ERROR,
    };
  }

  const fallbackData = await saveLocalFallbackSummary(
    groupId,
    rawChat,
    "Manual local summary requested by user."
  );

  return {
    success: true,
    data: fallbackData,
  };
}

export async function summarizeChatCore(groupId: string, rawChat: string): Promise<SummarizeResult> {
  const dbGroup = await prisma.lineGroup.findUnique({
    where: { id: groupId },
  });

  if (dbGroup && dbGroup.syncStatus === "completed" && dbGroup.unreadCount === 0) {
    return {
      success: false,
      error: NO_NEW_MESSAGES_ERROR,
    };
  }

  const cleanedChat = rawChat ? rawChat.trim() : "";
  const messages = parseChatMessages(cleanedChat);

  if (!cleanedChat || messages.length === 0) {
    await prisma.lineGroup.update({
      where: { id: groupId },
      data: {
        syncStatus: dbGroup?.summaryOverall ? "completed" : "idle",
        syncError: null,
      },
    });

    return {
      success: false,
      error: NO_NEW_MESSAGES_ERROR,
    };
  }

  const apiKey = await getGeminiApiKey();

  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey.trim() === "") {
    const fallbackData = await saveLocalFallbackSummary(
      groupId,
      rawChat,
      "GEMINI_API_KEY is not configured, so the system generated a local summary from raw chat."
    );

    return {
      success: true,
      data: fallbackData,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const systemInstruction = `You are an expert AI assistant that specializes in analyzing team chat logs (such as LINE group chats) in Thai.
Your task is to summarize the chat log, evaluate the sentiment score (0 to 100), identify active contributors, summarize by timeline (morning, afternoon, evening), extract action items, and detect top topics of discussion.

Guidelines:
1. Summarize in Thai. Ensure the tone is clear and concise.
2. For action items, extract tasks, who they are assigned to, and the deadline if mentioned. If no assignee is explicitly named, try to infer it from context or write "ไม่ระบุ".
3. Evaluate the overall chat sentiment (Positive, Neutral, Mixed, or Negative) and give a sentiment score out of 100 representing positive mood level.
4. Categorize topics into work, urgent, finance, social, or general. Evaluate relevance (0 to 100).
5. Extract key bullet points for each topic.
6. For morning, afternoon, and evening summaries, ALWAYS format the output as a list of bullet points starting with "- " and separated by newlines (e.g. "- point 1\n- point 2"). Avoid long continuous paragraphs for these fields.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `Here is the chat log:\n\n${rawChat}` }] },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            stats: {
              type: "object",
              properties: {
                messagesToday: { type: "integer", description: "Estimated number of messages processed in this conversation segment" },
                messagesChange: { type: "integer", description: "A simulated change percentage compared to yesterday, e.g. 15 or -10" },
                activeContributorsCount: { type: "integer", description: "Number of active people chatting in this segment" },
                sentiment: { type: "string", enum: ["Positive", "Neutral", "Mixed", "Negative"] },
                sentimentScore: { type: "integer", description: "Sentiment score out of 100 (0 is highly negative, 100 is highly positive)" },
              },
              required: ["messagesToday", "messagesChange", "activeContributorsCount", "sentiment", "sentimentScore"],
            },
            summary: {
              type: "object",
              properties: {
                overall: { type: "string", description: "Brief high-level summary paragraph of the day's discussion" },
                morning: { type: "string", description: "Summary of discussion happening in morning hours, formatted as bullet points starting with '- ' and separated by newlines." },
                afternoon: { type: "string", description: "Summary of discussion happening in afternoon hours, formatted as bullet points starting with '- ' and separated by newlines." },
                evening: { type: "string", description: "Summary of discussion happening in evening or night hours, formatted as bullet points starting with '- ' and separated by newlines." },
              },
              required: ["overall", "morning", "afternoon", "evening"],
            },
            actionItems: {
              type: "array",
              description: "Extracted tasks and action items that need to be done",
              items: {
                type: "object",
                properties: {
                  task: { type: "string", description: "Detailed description of the task or duty assigned" },
                  assignee: { type: "string", description: "Who is assigned to this task. If not clear, set 'ไม่ระบุ'" },
                  dueDate: { type: "string", description: "Due date/time if mentioned. If not mentioned, omit." },
                },
                required: ["task", "assignee"],
              },
            },
            topics: {
              type: "array",
              description: "Main topics discussed in the chat",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Short descriptive name of the topic" },
                  category: { type: "string", enum: ["urgent", "work", "finance", "social", "general"] },
                  relevance: { type: "integer", description: "Relevance score from 0 to 100" },
                  keyPoints: {
                    type: "array",
                    description: "Key summary points under this topic",
                    items: { type: "string" },
                  },
                },
                required: ["name", "category", "relevance", "keyPoints"],
              },
            },
          },
          required: ["stats", "summary", "actionItems", "topics"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response text from Gemini API");
    }

    const parsedData = normalizePayload(JSON.parse(jsonText));
    await saveSummaryPayload(groupId, parsedData);

    return {
      success: true,
      data: parsedData,
    };
  } catch (err: unknown) {
    console.error("Gemini API Error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);

    const fallbackData = await saveLocalFallbackSummary(
      groupId,
      rawChat,
      `Gemini API failed, so local summary was generated instead. Error: ${errorMessage}`
    );

    return {
      success: true,
      data: fallbackData,
    };
  }
}

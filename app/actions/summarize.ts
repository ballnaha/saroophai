"use server";

import { GoogleGenAI } from "@google/genai";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface SummarizeResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function summarizeChat(groupId: string, rawChat: string): Promise<SummarizeResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE" || apiKey.trim() === "") {
    // Save failed status to database
    await prisma.lineGroup.update({
      where: { id: groupId },
      data: {
        syncStatus: "failed",
        syncError: "กรุณาใส่ GEMINI_API_KEY ของคุณในไฟล์ .env.local เพื่อเรียกใช้งานการสรุปข้อมูลจริงจาก AI",
      },
    });

    return {
      success: false,
      error: "กรุณาใส่ GEMINI_API_KEY ของคุณในไฟล์ .env.local เพื่อเรียกใช้งานการสรุปข้อมูลจริงจาก AI",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert AI assistant that specializes in analyzing team chat logs (such as LINE group chats) in Thai.
Your task is to summarize the chat log, evaluate the sentiment score (0 to 100), identify active contributors, summarize by timeline (morning, afternoon, evening), extract action items, and detect top topics of discussion.

Guidelines:
1. Summarize in Thai. Ensure the tone is clear and concise.
2. For action items, extract tasks, who they are assigned to, and the deadline if mentioned. If no assignee is explicitly named, try to infer it from context or write "ไม่ระบุ".
3. Evaluate the overall chat sentiment (Positive, Neutral, Mixed, or Negative) and give a sentiment score out of 100 representing positive mood level.
4. Categorize topics into work, urgent, finance, social, or general. Evaluate relevance (0 to 100).
5. Extract key bullet points for each topic.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `Here is the chat log:\n\n${rawChat}` }] }
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
                sentimentScore: { type: "integer", description: "Sentiment score out of 100 (0 is highly negative, 100 is highly positive)" }
              },
              required: ["messagesToday", "messagesChange", "activeContributorsCount", "sentiment", "sentimentScore"]
            },
            summary: {
              type: "object",
              properties: {
                overall: { type: "string", description: "Brief high-level summary paragraph of the day's discussion" },
                morning: { type: "string", description: "Summary of discussion happening in morning hours" },
                afternoon: { type: "string", description: "Summary of discussion happening in afternoon hours" },
                evening: { type: "string", description: "Summary of discussion happening in evening or night hours" }
              },
              required: ["overall", "morning", "afternoon", "evening"]
            },
            actionItems: {
              type: "array",
              description: "Extracted tasks and action items that need to be done",
              items: {
                type: "object",
                properties: {
                  task: { type: "string", description: "Detailed description of the task or duty assigned" },
                  assignee: { type: "string", description: "Who is assigned to this task (e.g. 'Thanya (Dev)'). If not clear, set 'ไม่ระบุ'" },
                  dueDate: { type: "string", description: "Due date/time if mentioned (e.g., 'วันนี้, 12:00' or '08 มิ.ย. 2569'). If not mentioned, omit." }
                },
                required: ["task", "assignee"]
              }
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
                    items: { type: "string" }
                  }
                },
                required: ["name", "category", "relevance", "keyPoints"]
              }
            }
          },
          required: ["stats", "summary", "actionItems", "topics"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response text from Gemini API");
    }

    const parsedData = JSON.parse(jsonText);

    // Write to MySQL database using Prisma transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Update basic fields on LineGroup
      await tx.lineGroup.update({
        where: { id: groupId },
        data: {
          syncStatus: "completed",
          lastSynced: "เมื่อสักครู่",
          unreadCount: 0,
          syncError: null,
          messagesToday: parsedData.stats.messagesToday,
          messagesChange: parsedData.stats.messagesChange,
          activeContributorsCount: parsedData.stats.activeContributorsCount,
          sentiment: parsedData.stats.sentiment,
          sentimentScore: parsedData.stats.sentimentScore,
          summaryOverall: parsedData.summary.overall,
          summaryMorning: parsedData.summary.morning,
          summaryAfternoon: parsedData.summary.afternoon,
          summaryEvening: parsedData.summary.evening,
        },
      });

      // 2. Clear old action items and insert new ones
      await tx.actionItem.deleteMany({
        where: { groupId },
      });
      if (parsedData.actionItems && parsedData.actionItems.length > 0) {
        await tx.actionItem.createMany({
          data: parsedData.actionItems.map((item: any, idx: number) => ({
            id: `act_gen_${groupId}_${idx}_${Date.now()}`,
            groupId,
            task: item.task,
            assignee: item.assignee,
            status: "pending",
            dueDate: item.dueDate || null,
          })),
        });
      }

      // 3. Clear old topics and insert new ones
      await tx.topic.deleteMany({
        where: { groupId },
      });
      if (parsedData.topics && parsedData.topics.length > 0) {
        await tx.topic.createMany({
          data: parsedData.topics.map((topic: any) => ({
            groupId,
            name: topic.name,
            category: topic.category,
            relevance: topic.relevance,
            keyPoints: topic.keyPoints,
          })),
        });
      }
    });

    return {
      success: true,
      data: parsedData,
    };
  } catch (err: any) {
    console.error("Gemini API Error:", err);

    // Save failed status to database
    try {
      await prisma.lineGroup.update({
        where: { id: groupId },
        data: {
          syncStatus: "failed",
          syncError: `เกิดข้อผิดพลาดในการเรียกใช้ Gemini API: ${err.message || err}`,
        },
      });
    } catch (dbErr) {
      console.error("Failed to save error status to database:", dbErr);
    }

    return {
      success: false,
      error: `เกิดข้อผิดพลาดในการเรียกใช้ Gemini API: ${err.message || err}`,
    };
  }
}

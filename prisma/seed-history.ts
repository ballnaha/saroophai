import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const DAY_MS = 24 * 60 * 60 * 1000;

type GroupSeedProfile = {
  topics: Array<{
    name: string;
    category: "urgent" | "work" | "finance" | "social" | "general";
    keyPoints: string[];
  }>;
  actionAssignees: string[];
  summaryTheme: string;
  morning: string[];
  afternoon: string[];
  evening: string[];
  baseMessages: number;
  baseSentimentScore: number;
  sentiment: "Positive" | "Neutral" | "Mixed" | "Negative";
};

const defaultProfile: GroupSeedProfile = {
  topics: [
    {
      name: "ภาพรวมการประสานงาน",
      category: "general",
      keyPoints: ["สรุปสถานะงานประจำวัน", "ติดตามงานค้างและประเด็นที่ต้องตรวจสอบต่อ"],
    },
  ],
  actionAssignees: ["ไม่ระบุ"],
  summaryTheme: "การประสานงานทั่วไปและการติดตามสถานะงานของทีม",
  morning: ["ทีมเช็กสถานะงานที่ค้างจากวันก่อน", "สรุปประเด็นที่ต้องติดตามในช่วงเช้า"],
  afternoon: ["มีการอัปเดตความคืบหน้าและแบ่งงานเพิ่มเติม", "ติดตามประเด็นที่ต้องรอข้อมูลจากผู้เกี่ยวข้อง"],
  evening: ["สรุปสิ่งที่ทำเสร็จและรายการที่ต้องต่อในวันถัดไป"],
  baseMessages: 48,
  baseSentimentScore: 62,
  sentiment: "Neutral",
};

const profilesByGroupId: Record<string, GroupSeedProfile> = {
  grp_01: {
    topics: [
      {
        name: "Staging Deployment",
        category: "work",
        keyPoints: ["ตรวจความพร้อมของ staging", "ติดตามผลทดสอบหลัง deploy"],
      },
      {
        name: "Dashboard QA",
        category: "urgent",
        keyPoints: ["ตรวจบั๊ก UI ที่พบจากทีม QA", "จัดลำดับงานแก้ไขก่อน demo"],
      },
      {
        name: "Demo Preparation",
        category: "general",
        keyPoints: ["ซ้อม flow การนำเสนอ", "เตรียมข้อมูลตอบคำถามผู้บริหาร"],
      },
    ],
    actionAssignees: ["Thanya (Dev)", "Kittisak (QA)", "Nattapon (PM)", "Somsak (UX)"],
    summaryTheme: "งานพัฒนา dashboard, QA, staging และการเตรียม demo",
    morning: ["ทีมทบทวนบั๊ก UI และงานที่ต้องแก้ก่อนปล่อย staging", "Dev กับ QA แบ่งงานตรวจหน้าจอสำคัญ"],
    afternoon: ["มีการอัปเดตผลทดสอบและปรับรายละเอียดตาม feedback", "PM ติดตามความพร้อมของ demo และรายการ blocker"],
    evening: ["ทีมสรุปประเด็นค้างและกำหนดรายการตรวจซ้ำในวันถัดไป"],
    baseMessages: 110,
    baseSentimentScore: 78,
    sentiment: "Positive",
  },
  grp_02: {
    topics: [
      {
        name: "Sales Pipeline",
        category: "finance",
        keyPoints: ["ทบทวนยอดขายรายสัปดาห์", "ติดตามดีลที่มีโอกาสปิดในเดือนนี้"],
      },
      {
        name: "Campaign Planning",
        category: "work",
        keyPoints: ["เตรียม brief สื่อโฆษณา", "กำหนดช่วงเวลาโพสต์แคมเปญ"],
      },
      {
        name: "Client Follow-up",
        category: "urgent",
        keyPoints: ["ติดตามลูกค้ารายใหญ่ที่เลื่อนคำสั่งซื้อ", "เตรียมข้อเสนอส่วนลดเพิ่มเติม"],
      },
    ],
    actionAssignees: ["Kanya (Sales)", "Vichai (Mkt)", "Prasert (VP)", "Sarah (Admin)"],
    summaryTheme: "ยอดขาย, campaign marketing และการติดตามลูกค้ารายสำคัญ",
    morning: ["ฝ่ายขายอัปเดต pipeline และยอดคาดการณ์", "ทีม marketing ตรวจรายการงานโปรโมชันที่ต้องออกแบบ"],
    afternoon: ["สรุปรายการสินค้าที่เข้าร่วมแคมเปญและเงื่อนไขราคา", "ติดตามสถานะ brief โฆษณาและช่องทางเผยแพร่"],
    evening: ["สรุปรายการลูกค้าที่ต้อง follow-up และข้อมูลที่ต้องส่งต่อฝ่ายจัดซื้อ"],
    baseMessages: 82,
    baseSentimentScore: 61,
    sentiment: "Mixed",
  },
  grp_03: {
    topics: [
      {
        name: "SCG API Integration",
        category: "work",
        keyPoints: ["ทดสอบ endpoint ชุด staging", "ตรวจรูปแบบข้อมูลก่อนส่งเข้าระบบ"],
      },
      {
        name: "Date Format Issue",
        category: "urgent",
        keyPoints: ["แก้รูปแบบวันที่ให้รองรับ ISO-8601", "ตรวจ log กรณี API ตอบ error"],
      },
      {
        name: "Client Coordination",
        category: "general",
        keyPoints: ["ประสานข้อมูลกับทีมลูกค้า", "เตรียมเอกสารสรุปผลทดสอบ"],
      },
    ],
    actionAssignees: ["Client Contact", "Thanya (Dev)", "Nattapon (PM)"],
    summaryTheme: "การประสานงาน SCG, API integration และการทดสอบข้อมูล",
    morning: ["ทีมตรวจเอกสาร API และประเด็นที่ต้องยืนยันกับลูกค้า", "Dev เตรียม environment สำหรับทดสอบเชื่อมต่อ"],
    afternoon: ["มีการแก้ไข mapping ข้อมูลและทดสอบ endpoint เพิ่มเติม", "PM รวบรวมข้อสังเกตเพื่อส่งให้ฝั่งลูกค้า"],
    evening: ["สรุปผลทดสอบและรายการคำถามที่ต้องรอคำตอบจากทีม SCG"],
    baseMessages: 58,
    baseSentimentScore: 68,
    sentiment: "Neutral",
  },
};

function startOfLocalDayDaysAgo(daysAgo: number): Date {
  const date = new Date(Date.now() - daysAgo * DAY_MS);
  date.setHours(0, 0, 0, 0);
  return date;
}

function pick<T>(items: T[], index: number): T {
  return items[index % items.length];
}

function formatThaiRelativeDate(daysAgo: number): string {
  if (daysAgo === 1) return "เมื่อวาน";
  return `${daysAgo} วันก่อน`;
}

function buildDailyPayload(groupId: string, groupName: string, daysAgo: number) {
  const profile = profilesByGroupId[groupId] ?? defaultProfile;
  const topicA = pick(profile.topics, daysAgo);
  const topicB = pick(profile.topics, daysAgo + 1);
  const assigneeA = pick(profile.actionAssignees, daysAgo);
  const assigneeB = pick(profile.actionAssignees, daysAgo + 2);
  const dayLabel = formatThaiRelativeDate(daysAgo);
  const weekdayFactor = daysAgo % 7;
  const messagesCount = Math.max(12, profile.baseMessages + ((daysAgo * 13) % 37) - weekdayFactor * 4);
  const sentimentScore = Math.max(35, Math.min(92, profile.baseSentimentScore + ((daysAgo % 5) - 2) * 3));
  const sentiment =
    sentimentScore >= 72 ? "Positive" :
    sentimentScore <= 42 ? "Negative" :
    profile.sentiment;

  return {
    summaryDate: startOfLocalDayDaysAgo(daysAgo),
    summaryOverall: `${dayLabel} กลุ่ม ${groupName} มีการพูดคุยเกี่ยวกับ${profile.summaryTheme} โดยมีข้อความประมาณ ${messagesCount} รายการ ประเด็นหลักคือ ${topicA.name} และ ${topicB.name} พร้อมติดตามงานที่ต้องดำเนินการต่อในวันถัดไป`,
    summaryMorning: profile.morning.map((text) => `- ${text}`).join("\n"),
    summaryAfternoon: profile.afternoon.map((text) => `- ${text}`).join("\n"),
    summaryEvening: profile.evening.map((text) => `- ${text}`).join("\n"),
    messagesCount,
    activeContributorsCount: Math.max(2, Math.min(profile.actionAssignees.length, 2 + (daysAgo % 4))),
    sentiment,
    sentimentScore,
    topics: [
      {
        name: topicA.name,
        category: topicA.category,
        relevance: Math.max(60, 92 - (daysAgo % 8) * 3),
        keyPoints: topicA.keyPoints,
      },
      {
        name: topicB.name,
        category: topicB.category,
        relevance: Math.max(55, 84 - (daysAgo % 6) * 4),
        keyPoints: topicB.keyPoints,
      },
    ],
    actionItems: [
      {
        task: `ติดตามความคืบหน้าเรื่อง ${topicA.name}`,
        assignee: assigneeA,
        status: daysAgo > 5 ? "completed" : "pending",
        dueDate: dayLabel,
      },
      {
        task: `สรุปข้อมูลเพิ่มเติมสำหรับ ${topicB.name}`,
        assignee: assigneeB,
        status: daysAgo > 10 ? "completed" : "pending",
        dueDate: `${dayLabel}, 17:00`,
      },
    ],
  };
}

async function main() {
  const groups = await prisma.lineGroup.findMany({
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });

  if (groups.length === 0) {
    throw new Error("No LineGroup records found. Run the main seed first before seeding history.");
  }

  let upserted = 0;
  for (const group of groups) {
    for (let daysAgo = 1; daysAgo <= 30; daysAgo += 1) {
      const payload = buildDailyPayload(group.id, group.name, daysAgo);

      await prisma.dailySummary.upsert({
        where: {
          groupId_summaryDate: {
            groupId: group.id,
            summaryDate: payload.summaryDate,
          },
        },
        update: {
          summaryOverall: payload.summaryOverall,
          summaryMorning: payload.summaryMorning,
          summaryAfternoon: payload.summaryAfternoon,
          summaryEvening: payload.summaryEvening,
          messagesCount: payload.messagesCount,
          activeContributorsCount: payload.activeContributorsCount,
          sentiment: payload.sentiment,
          sentimentScore: payload.sentimentScore,
          topics: payload.topics as Prisma.InputJsonValue,
          actionItems: payload.actionItems as Prisma.InputJsonValue,
        },
        create: {
          groupId: group.id,
          summaryDate: payload.summaryDate,
          summaryOverall: payload.summaryOverall,
          summaryMorning: payload.summaryMorning,
          summaryAfternoon: payload.summaryAfternoon,
          summaryEvening: payload.summaryEvening,
          messagesCount: payload.messagesCount,
          activeContributorsCount: payload.activeContributorsCount,
          sentiment: payload.sentiment,
          sentimentScore: payload.sentimentScore,
          topics: payload.topics as Prisma.InputJsonValue,
          actionItems: payload.actionItems as Prisma.InputJsonValue,
        },
      });

      upserted += 1;
    }
  }

  console.log(`Seeded ${upserted} daily summary history records for ${groups.length} groups.`);
}

main()
  .catch((error) => {
    console.error("Failed to seed history:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

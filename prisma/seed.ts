import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getTodayAt(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding started...");

  // 1. Clear existing database records to avoid duplicates
  // Cascade delete is active, so deleting LineGroups will clear all relationships
  await prisma.lineGroup.deleteMany();
  console.log("Cleared old data.");

  // Group 01: PSC Development Team
  await prisma.lineGroup.create({
    data: {
      id: "grp_01",
      name: "PSC Development Team",
      avatarColor: "#10b981",
      groupImageUrl: "/uploads/line/mock/group-dev.svg",
      unreadCount: 4,
      lastActive: "15:42",
      membersCount: 12,
      syncStatus: "completed",
      lastSynced: "10 นาทีที่แล้ว",
      lastSyncedAt: new Date(Date.now() - 10 * 60 * 1000),
      messagesToday: 184,
      messagesChange: 24,
      activeContributorsCount: 8,
      sentiment: "Positive",
      sentimentScore: 82,
      summaryOverall: "การพูดคุยในวันนี้เน้นไปที่การเตรียม Deploy ระบบขึ้น Staging Environment สำหรับโปรเจกต์แผนงานใหม่ รวมถึงการแก้ไข UI บั๊กในหน้า Dashboard และการเตรียมข้อมูลนำเสนอผู้บริหารวันจันทร์หน้า",
      summaryMorning: "- ทีมตกลงแก้ไขปัญหา CSS Layout ของหน้า Dashboard ที่แสดงผลเพี้ยนในขนาดหน้าจอ iPad Pro\n- Thanya รับไปดำเนินการและอัปเดตโค้ดเข้า GitHub ในช่วงสาย",
      summaryAfternoon: "- Kittisak (QA) รายงานพบบั๊กเพิ่มเติมในระบบกรองข้อมูลวันที่ในหน้าสร้างแผน\n- ทีมตกลงว่าจะแก้ไขหลังจากการ Deploy รอบแรกผ่านไปแล้ว เพื่อไม่ให้กระทบกำหนดการ",
      summaryEvening: "- Nattapon (PM) สรุปกำหนดการนัดซ้อมนำเสนอเดโมงานจริงวันพรุ่งนี้เวลา 10:00 น.\n- ย้ำเตือนให้ทุกคนตรวจสอบความเรียบร้อยของหน้าเว็บสำหรับเตรียมแสดงผลจริง",
      hourlyActivity: [5, 2, 0, 0, 0, 0, 3, 15, 32, 28, 18, 12, 10, 45, 55, 30, 22, 14, 8, 4, 10, 6, 2, 1],
      rawChat: `[LINE Chat Log] PSC Development Team
[09:15] Nattapon (PM): สวัสดีครับทุกคน วันนี้มีการบ้านด่วนเรื่องหน้า Dashboard มีคนรายงานว่าแสดงผลเพี้ยนบน iPad Pro แนวตั้ง รบกวนใครว่างช่วยดูหน่อยครับ
[09:20] Thanya (Dev): เดี๋ยวผมเช็ค CSS Layout บน iPad Pro ให้ครับ น่าจะสไตล์หลุดนิดหน่อย ช่วงสาย ๆ น่าจะเสร็จครับ
[09:22] Kittisak (QA): ได้เลยครับ เดี๋ยวผมช่วยตรวจหลังจากพี่ Thanya แก้เสร็จนะ
[10:05] Thanya (Dev): ดันโค้ดแก้หน้า iPad Pro ขึ้น Git แล้วครับ บั๊ก CSS ตัวนี้แก้เรียบร้อย
[11:00] Kittisak (QA): ตรวจสอบบน iPad Pro แนวตั้งแล้วครับ แสดงผลถูกต้องแล้วครับผม
[13:10] Kittisak (QA): อ้อ พี่ ๆ ครับ ผมไปเจอบั๊กตัวใหม่ในหน้าสร้างแผน ตรงระบบกรองวันที่เหมือนจะไม่ทำงานถ้าใส่ข้ามปี
[13:15] Nattapon (PM): บั๊กกรองวันที่ข้ามปีร้ายแรงไหม ถ้าไม่ด่วนมากเดี๋ยวเราแปะไว้แก้เฟสหน้า เพื่อเตรียม Deploy ตัว Staging วันนี้ก่อนดีไหมครับ
[13:20] Thanya (Dev): เห็นด้วยครับ ถ้าแก้ตอนนี้อาจกระทบโครงสร้างการส่งค่า เอาไปแก้ช่วงวันจันทร์หน้าดีกว่าครับ
[13:25] Kittisak (QA): ได้ครับ ผมโน้ตบั๊กนี้ไว้ก่อน เดี๋ยวค่อยมาทำ Test Case รันทีหลัง
[14:45] Nattapon (PM): บ่ายนี้ผมเตรียมเปิดลิงก์ Staging ส่งให้ทีมการตลาดลองเล่นดูนะครับ ทุกคนมีความเห็นเพิ่มเติมไหม
[14:50] Somsak (UX): ตัว Mockup รายงานผลลัพธ์ของสัปดาห์หน้าผมอัปเดตใส่ Figma แล้วนะ รบกวนฝั่ง Dev ตรวจสอบความถูกต้องของ UI บลูปรินต์ด้วยครับ
[14:55] Thanya (Dev): รับทราบครับ เดี๋ยวเย็นนี้ผมเข้าไปเช็คความถูกต้องของ Mockup ตัวรายงานให้ครับ
[16:30] Nattapon (PM): สรุปตามนี้ครับ พรุ่งนี้ 10 โมงเช้า รบกวนทุกคนเข้าซ้อมเดโมตัวระบบที่จะพรีเซนต์ให้ผู้บริหารวันจันทร์ด้วยนะครับ เดี๋ยวผมทำสไลด์พรีเซนต์รอไว้`,
      contributors: {
        create: [
          { name: "Thanya (Dev)", messagesCount: 52, avatarColor: "#6366f1", profileImageUrl: "/uploads/line/mock/avatar-thanya.svg" },
          { name: "Kittisak (QA)", messagesCount: 38, avatarColor: "#f59e0b", profileImageUrl: "/uploads/line/mock/avatar-kittisak.svg" },
          { name: "Nattapon (PM)", messagesCount: 31, avatarColor: "#f43f5e", profileImageUrl: "/uploads/line/mock/avatar-nattapon.svg" },
          { name: "Somsak (UX)", messagesCount: 22, avatarColor: "#14b8a6" },
        ]
      },
      actionItems: {
        create: [
          { id: "act_01", task: "แก้ไข CSS Layout หน้า Dashboard สำหรับ iPad Pro และดันโค้ดเข้า git", assignee: "Thanya (Dev)", status: "completed", dueDate: "วันนี้, 12:00" },
          { id: "act_02", task: "เตรียมสไลด์และเนื้อหาการพรีเซนต์เดโมระบบสำหรับผู้บริหาร", assignee: "Nattapon (PM)", status: "pending", dueDate: "พรุ่งนี้, 09:30" },
          { id: "act_03", task: "เขียน Test Case สำหรับระบบกรองข้อมูลวันที่ที่พบบั๊ก", assignee: "Kittisak (QA)", status: "pending", dueDate: "08 มิ.ย. 2569" },
          { id: "act_04", task: "ตรวจสอบ Mockup ล่าสุดของหน้ารายงานผลลัพธ์", assignee: "Somsak (UX)", status: "pending", dueDate: "วันนี้, 18:00" },
        ]
      },
      topics: {
        create: [
          {
            name: "Deployment to Staging",
            category: "work",
            relevance: 95,
            keyPoints: [
              "ตกลง Deploy โค้ดเวอร์ชัน 1.2.0 ไปยังเซิร์ฟเวอร์จำลองเพื่อทดสอบรวมระบบ",
              "เปิดสิทธิ์การเข้าถึงให้ฝ่ายการตลาดเข้ามาลองใช้งานระบบค่ำวันนี้"
            ]
          },
          {
            name: "UI / CSS Bugs (iPad)",
            category: "urgent",
            relevance: 88,
            keyPoints: [
              "ปัญหา Layout ซ้อนทับกันเมื่อเปลี่ยนหน้าจอเป็นแนวตั้ง",
              "ได้รับการแก้ไขแล้วโดยทีม Front-end และ Deploy ทันที"
            ]
          },
          {
            name: "Demo Preparation",
            category: "general",
            relevance: 75,
            keyPoints: [
              "การจัดคิวและลำดับผู้พูดในงานเดโมวันจันทร์นี้",
              "กำหนดซ้อมรันคิวแบบ End-to-End เวลา 10:00 น. พรุ่งนี้"
            ]
          }
        ]
      },
      attachments: {
        create: [
          {
            id: "mock_img_grp_01_dashboard_review",
            senderName: "Somsak (UX)",
            messageType: "image",
            contentProviderType: "mock",
            filePath: "/uploads/line/mock/project-dashboard-review.svg",
            mimeType: "image/svg+xml",
            fileSize: 2450,
            messageTimestamp: getTodayAt(14, 52),
          },
          {
            id: "mock_img_grp_01_staging_preview",
            senderName: "Nattapon (PM)",
            messageType: "image",
            contentProviderType: "mock",
            filePath: "/uploads/line/mock/staging-link-preview.svg",
            mimeType: "image/svg+xml",
            fileSize: 2200,
            messageTimestamp: getTodayAt(14, 47),
          },
          {
            id: "mock_vid_grp_01_demo",
            senderName: "Thanya (Dev)",
            messageType: "video",
            contentProviderType: "mock",
            originalContentUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            previewImageUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
            mimeType: "video/mp4",
            fileSize: 153000,
            messageTimestamp: getTodayAt(15, 12),
          },
        ],
      }
    }
  });

  // Group 02: Sales & Marketing Sync
  await prisma.lineGroup.create({
    data: {
      id: "grp_02",
      name: "Sales & Marketing Sync",
      avatarColor: "#f43f5e",
      groupImageUrl: "/uploads/line/mock/group-sales.svg",
      unreadCount: 0,
      lastActive: "12:15",
      membersCount: 8,
      syncStatus: "completed",
      lastSynced: "2 ชั่วโมงที่แล้ว",
      lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      messagesToday: 95,
      messagesChange: -10,
      activeContributorsCount: 4,
      sentiment: "Mixed",
      sentimentScore: 61,
      summaryOverall: "การคุยเน้นเรื่องยอดขายประจำเดือนพฤษภาคมที่ต่ำกว่าเป้าเล็กน้อย และการจัดทำโปรโมชัน Mid-Year Sale ที่ต้องรีบสรุปเพื่อเตรียมทำแบนเนอร์โฆษณาในสัปดาห์หน้า",
      summaryMorning: "- Kanya เสนอรายงานยอดขายและคาดการณ์ยอดสั่งซื้อของไตรมาสที่ 2\n- พบประเด็นลูกค้ารายใหญ่ชะลอคำสั่งซื้อเพื่อทบทวนงบประมาณ",
      summaryAfternoon: "- ทีมตกลงจัดโปรโมชัน Mid-Year Sale (15-25 มิถุนายนนี้)\n- ลดสูงสุด 15% กลุ่มสินค้าไอที และแถมของขวัญเมื่อช้อปครบ 5,000 บาท",
      summaryEvening: "- ฝ่ายกราฟิกดีไซเนอร์ส่งแบนเนอร์หลัก 3 ขนาดสำหรับโปรโมตใน Social Media\n- Kanya เตรียมประสานงานตรวจสอบราคาต้นทุนสินค้ากับฝ่ายจัดซื้อต่อในวันพรุ่งนี้",
      hourlyActivity: [0, 0, 0, 0, 0, 0, 1, 8, 25, 20, 15, 12, 4, 10, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0],
      rawChat: `[LINE Chat Log] Sales & Marketing Sync
[09:30] Prasert (VP): ยอดขายเดือนพฤษภาคมส่งมาหรือยังครับ ทำไมรู้สึกเหมือนเราจะไม่ถึงเป้า
[09:40] Kanya (Sales): ส่งข้อมูลให้แล้วค่ะ ยอดต่ำกว่าเป้าไปประมาณ 3% ค่ะ เนื่องจากลูกค้ารายใหญ่อย่าง Client X ขอชะลอการสั่งซื้อเพื่อทบทวนงบประมาณปีนี้ค่ะ
[09:45] Prasert (VP): งั้น Kanya รบกวนขอนัดคุยกับ Client X หน่อยนะ เราอาจต้องเสนอส่วนลดพิเศษหรือสิทธิประโยชน์เพิ่มเติมเพื่อจูงใจให้เขาเซ็นสัญญาระยะยาวกับเรา
[10:15] Vichai (Mkt): สำหรับ Mid-Year Sale ที่จะจัดวันที่ 15-25 มิ.ย. นี้ ผมคิดโปรโมชันหลักเสร็จแล้วครับ ลดสูงสุด 15% ในกลุ่มสินค้าไอที และมีของแถมพรีเมียมเมื่อช้อปครบ 5,000 บาทครับ
[10:30] Prasert (VP): โปรโมชันโอเคเลย แต่ฝั่งจัดซื้อตรวจสอบราคาต้นทุนหรือยัง Kanya ช่วยส่งสรุปรายการสินค้าจัดซื้อให้เคาะราคาก่อนวันจันทร์นะ
[13:22] Vichai (Mkt): เดี๋ยวผมส่ง Brief แบนเนอร์โฆษณาแคมเปญนี้ให้ฝ่ายกราฟิกดีไซเนอร์เลยครับ จะได้เสร็จทันโพสต์สัปดาห์หน้า
[15:15] Vichai (Mkt): ส่ง Brief แบนเนอร์ให้กราฟิกเรียบร้อยแล้วครับ ทั้งหมด 3 ขนาดสำหรับ Facebook และ LINE VOOM
[16:40] Kanya (Sales): ขอบคุณค่ะ เดี๋ยวพรุ่งนี้ส่งราคาต้นทุนหลังจัดซื้อเคาะเสร็จให้นะคะ`,
      contributors: {
        create: [
          { name: "Kanya (Sales)", messagesCount: 35, avatarColor: "#a855f7" },
          { name: "Vichai (Mkt)", messagesCount: 30, avatarColor: "#10b981", profileImageUrl: "/uploads/line/mock/avatar-vichai.svg" },
          { name: "Prasert (VP)", messagesCount: 20, avatarColor: "#f59e0b" },
          { name: "Sarah (Admin)", messagesCount: 10, avatarColor: "#0ea5e9" },
        ]
      },
      actionItems: {
        create: [
          { id: "act_05", task: "สรุปเงื่อนไขและสินค้าเข้าร่วม Mid-Year Sale ส่งให้ฝ่ายจัดซื้อเคาะราคาต้นทุน", assignee: "Kanya (Sales)", status: "pending", dueDate: "08 มิ.ย. 2569" },
          { id: "act_06", task: "ส่ง Brief ออกแบบแบนเนอร์หลัก 3 ขนาด ให้กราฟิกดีไซเนอร์", assignee: "Vichai (Mkt)", status: "completed", dueDate: "วันนี้, 15:30" },
          { id: "act_07", task: "ติดต่อลูกค้ารายใหญ่ (Client X) เพื่อเจรจาสัญญาซื้อขายระยะยาวเพิ่มส่วนลดพิเศษ", assignee: "Prasert (VP)", status: "pending", dueDate: "12 มิ.ย. 2569" },
        ]
      },
      topics: {
        create: [
          {
            name: "Mid-Year Sale Campaign",
            category: "finance",
            relevance: 92,
            keyPoints: [
              "เป้าหมายยอดขายแคมเปญนี้อยู่ที่ 1.5 ล้านบาท",
              "งบประมาณโปรโมตโพสต์โซเชียลมีเดีย 15,000 บาท"
            ]
          },
          {
            name: "Client X Renewal Delay",
            category: "urgent",
            relevance: 85,
            keyPoints: [
              "ลูกค้าติดปัญหาเรื่องการปรับงบประมาณภายในองค์กร",
              "คู่แข่งเสนอราคาที่ถูกกว่า 5% ต้องทำการนัดคุยแบบส่วนตัวเพื่อเสนอข้อตกลงพิเศษ"
            ]
          }
        ]
      },
      attachments: {
        create: [
          {
            id: "mock_img_grp_02_campaign_brief",
            senderName: "Vichai (Mkt)",
            messageType: "image",
            contentProviderType: "mock",
            filePath: "/uploads/line/mock/campaign-banner-brief.svg",
            mimeType: "image/svg+xml",
            fileSize: 2300,
            messageTimestamp: getTodayAt(15, 16),
          },
        ],
      }
    }
  });

  // Group 03: ประสานงานลูกค้า (SCG Project) - Initially IDLE
  await prisma.lineGroup.create({
    data: {
      id: "grp_03",
      name: "ประสานงานลูกค้า (SCG Project)",
      avatarColor: "#3b82f6",
      groupImageUrl: "/uploads/line/mock/group-scg.svg",
      unreadCount: 15,
      lastActive: "15:52",
      membersCount: 6,
      syncStatus: "idle",
      lastSynced: "ยังไม่เคยซิงค์ข้อมูลวันนี้",
      lastSyncedAt: null,
      messagesToday: 42,
      messagesChange: 5,
      activeContributorsCount: 3,
      sentiment: "Neutral",
      sentimentScore: 50,
      summaryOverall: "ยังไม่ได้ทำการวิเคราะห์สรุปข้อมูลล่าสุดของวันนี้ เนื่องจากระบบยังไม่ได้เชื่อมต่อดึงข้อมูล กรุณากดปุ่ม Sync ข้อมูลด้านบนเพื่อเริ่มต้นสรุปรายงาน",
      summaryMorning: "-",
      summaryAfternoon: "-",
      summaryEvening: "-",
      hourlyActivity: [0, 0, 0, 0, 0, 0, 0, 0, 4, 12, 8, 3, 0, 2, 5, 8, 0, 0, 0, 0, 0, 0, 0, 0],
      rawChat: `[LINE Chat Log] ประสานงานลูกค้า (SCG Project)
[09:05] Client Contact: สวัสดีครับทีมงาน วันนี้ทางไอทีของ SCG ได้ส่งคู่มือสำหรับเชื่อมต่อ API Endpoint ชุดทดสอบมาให้ทางเมลแล้วนะครับ รบารประสานงานกับเดฟให้หน่อยครับ
[09:15] Nattapon (PM): ขอบคุณครับ ได้รับเมลแล้วครับ เดี๋ยวประสานต่อให้ Thanya ดำเนินการตั้งค่าทดสอบให้ครับ
[09:45] Thanya (Dev): ได้รับข้อมูล API แล้วครับ กำลังนำกุญแจเชื่อมต่อและ Endpoint ไปเซ็ตอัปบน Server ฝั่งเราครับ
[11:30] Thanya (Dev): ตอนนี้ทดสอบยิง API ไปฝั่ง SCG มีปัญหาดึงข้อมูลใบสั่งซื้อบางรายการแล้วได้ Error 500 กลับมาครับ กำลังเช็ค Log อยู่
[13:30] Client Contact: ทางเราเช็คระบบหลังบ้านแล้วพบว่าน่าจะเกิดจาก Date Format ครับ ทางระบบ SCG บังคับส่งวันที่ในฟอร์แมต ISO-8601 (YYYY-MM-DD) เท่านั้นครับ
[13:40] Thanya (Dev): อ้อ จริงด้วยครับ ฝั่งเราส่งไปเป็น DD-MM-YYYY เดี๋ยวผมขอแก้ฟังก์ชันการแปลง Format วันที่ให้รองรับรูปแบบนี้ก่อนครับ น่าจะแก้ไขและทดสอบยิงใหม่ได้ภายในบ่ายนี้ครับ
[15:10] Thanya (Dev): แก้ไขเรียบร้อยและลองรันเชื่อมต่อใหม่ไป 10 รอบ ได้ผลลัพธ์ผ่าน 100% แล้วครับ สรุปดึงข้อมูลเข้าสู่ระบบจำลองได้เรียบร้อยครับ
[15:40] Nattapon (PM): เยี่ยมเลยครับคุณ Thanya เดี๋ยวผมจะรวบรวมข้อมูลสรุปผลการทดสอบการเชื่อมต่อ (API Integration Report) ส่งไปให้ทาง PM ฝั่ง SCG ช่วยรีวิวก่อนเที่ยงวันพรุ่งนี้นะครับ
[15:45] Client Contact: ยอดเยี่ยมเลยครับ สะดวกรวดเร็วมาก ถ้าเอกสารผ่านแล้ว สัปดาห์หน้าเรานัดประชุมสรุปงานเฟสแรกกันต่อนะครับ ขอบคุณทีมงานมากครับ`,
      contributors: {
        create: [
          { name: "Client Contact", messagesCount: 25, avatarColor: "#ca8a04" },
          { name: "Thanya (Dev)", messagesCount: 12, avatarColor: "#6366f1" },
          { name: "Nattapon (PM)", messagesCount: 5, avatarColor: "#f43f5e" },
        ]
      }
    }
  });

  // 4. Seed Daily Summary History for testing
  console.log("Seeding Daily Summaries...");
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);

  // Group 1 yesterday summary
  await prisma.dailySummary.create({
    data: {
      groupId: "grp_01",
      summaryDate: yesterday,
      summaryOverall: "เมื่อวานนี้การพูดคุยของทีมพัฒนาเป็นไปด้วยดี ทีมแก้ไขปัญหา CSS Layout ของหน้า Dashboard บน iPad Pro และนำไปทดสอบบน Staging Environment เรียบร้อย",
      summaryMorning: "- Thanya ทำการวิเคราะห์หาสาเหตุที่ Layout เพี้ยนบน iPad Pro\n- ทีมร่วมกันเสนอแนวทางการแก้สไตล์หลุด",
      summaryAfternoon: "- ทีมดันโค้ดขึ้น Git และเริ่ม Deploy ไปยัง Staging Server เพื่อเปิดให้ทีมการตลาดได้ร่วมทดสอบ",
      summaryEvening: "- Kittisak ตรวจสอบผลงานบน iPad Pro แนวตั้งและยืนยันว่าแก้ไขเรียบร้อยแล้ว\n- PM นัดหมายซ้อมเดโมของจริงในวันถัดไป",
      messagesCount: 120,
      activeContributorsCount: 4,
      sentiment: "Positive",
      sentimentScore: 85,
      topics: [
        {
          name: "iPad CSS Bug Fix",
          category: "urgent",
          relevance: 90,
          keyPoints: ["ตรวจพบ CSS หลุดในแนวตั้ง", "ได้รับการแก้ไขและ Deploy ทันที"]
        },
        {
          name: "Staging Deployment",
          category: "work",
          relevance: 80,
          keyPoints: ["อัปเดตโค้ดขึ้น staging เรียบร้อย", "ทีมการตลาดเริ่มทำการทดสอบช่วงค่ำ"]
        }
      ],
      actionItems: [
        { task: "แก้ไข CSS Layout สำหรับ iPad Pro", assignee: "Thanya (Dev)", status: "completed", dueDate: "เมื่อวาน, 12:00" },
        { task: "ตรวจผลการแสดงผลบน iPad Pro แนวตั้ง", assignee: "Kittisak (QA)", status: "pending", dueDate: "เมื่อวาน, 15:00" }
      ]
    }
  });

  // Group 1 two days ago summary
  await prisma.dailySummary.create({
    data: {
      groupId: "grp_01",
      summaryDate: twoDaysAgo,
      summaryOverall: "เมื่อ 2 วันก่อน ทีมมีการวางแผนเบื้องต้นเรื่องฟังก์ชันรายงานผลลัพธ์ที่จะพัฒนาในสัปดาห์หน้า โดย Somsak (UX) กำลังออกแบบหน้าเดโม",
      summaryMorning: "- PM บรีฟหัวข้อความต้องการของระบบรายงานที่จะส่งต่อให้ผู้บริหาร\n- ทีมพัฒนาร่วมแสดงความเห็นเกี่ยวกับขีดความสามารถของระบบ",
      summaryAfternoon: "- Somsak เริ่มทำการออกแบบ Mockup และจะอัปโหลดใส่ Figma ช่วงเย็น",
      summaryEvening: "- ทีมตกลงจะมาคุยรายละเอียด UI บลูปรินต์กันอีกครั้งหลังจาก Mockup เสร็จ",
      messagesCount: 64,
      activeContributorsCount: 3,
      sentiment: "Neutral",
      sentimentScore: 65,
      topics: [
        {
          name: "Report System Planning",
          category: "work",
          relevance: 75,
          keyPoints: ["เตรียมแบบร่างความต้องการสำหรับระบบรายงาน", "Somsak รับหน้าที่ออกแบบ Mockup ลง Figma"]
        }
      ],
      actionItems: [
        { task: "ออกแบบรายงานเวอร์ชันแรกใน Figma", assignee: "Somsak (UX)", status: "pending", dueDate: "2 วันก่อน, 18:00" }
      ]
    }
  });

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

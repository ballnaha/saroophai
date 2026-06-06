export interface Contributor {
  name: string;
  messagesCount: number;
  avatarColor: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  status: 'pending' | 'completed';
  dueDate?: string;
}

export interface Topic {
  name: string;
  category: 'urgent' | 'work' | 'finance' | 'social' | 'general';
  relevance: number; // 0-100
  keyPoints: string[];
}

export interface LineGroup {
  id: string;
  name: string;
  avatarColor: string;
  unreadCount: number;
  lastActive: string;
  membersCount: number;
  syncStatus: 'idle' | 'syncing' | 'completed' | 'failed';
  lastSynced: string;
  stats: {
    messagesToday: number;
    messagesChange: number; // e.g., +15
    activeContributorsCount: number;
    sentiment: 'Positive' | 'Neutral' | 'Mixed' | 'Negative';
    sentimentScore: number; // 0-100
  };
  contributors: Contributor[];
  summary: {
    overall: string;
    morning: string;
    afternoon: string;
    evening: string;
  };
  actionItems: ActionItem[];
  topics: Topic[];
  hourlyActivity: number[]; // 24 values representing hours of the day
  rawChat: string;
  syncError?: string;
}

export const mockLineGroups: LineGroup[] = [
  {
    id: 'grp_01',
    name: 'PSC Development Team',
    avatarColor: 'bg-emerald-500 text-white',
    unreadCount: 4,
    lastActive: '15:42',
    membersCount: 12,
    syncStatus: 'completed',
    lastSynced: '10 นาทีที่แล้ว',
    stats: {
      messagesToday: 184,
      messagesChange: 24,
      activeContributorsCount: 8,
      sentiment: 'Positive',
      sentimentScore: 82,
    },
    contributors: [
      { name: 'Thanya (Dev)', messagesCount: 52, avatarColor: 'bg-indigo-500' },
      { name: 'Kittisak (QA)', messagesCount: 38, avatarColor: 'bg-amber-500' },
      { name: 'Nattapon (PM)', messagesCount: 31, avatarColor: 'bg-rose-500' },
      { name: 'Somsak (UX)', messagesCount: 22, avatarColor: 'bg-teal-500' },
    ],
    summary: {
      overall: 'การพูดคุยในวันนี้เน้นไปที่การเตรียม Deploy ระบบขึ้น Staging Environment สำหรับโปรเจกต์แผนงานใหม่ รวมถึงการแก้ไข UI บั๊กในหน้า Dashboard และการเตรียมข้อมูลนำเสนอผู้บริหารวันจันทร์หน้า',
      morning: 'ทีมตกลงแก้ไขปัญหา CSS Layout ของหน้า Dashboard ที่แสดงผลเพี้ยนในขนาดหน้าจอ iPad Pro โดย Thanya รับไปดำเนินการและอัปเดตโค้ดเข้า GitHub ในช่วงสาย',
      afternoon: 'Kittisak (QA) รายงานพบบั๊กเพิ่มเติมในระบบกรองข้อมูลวันที่ในหน้าสร้างแผน ซึ่งทีมตกลงว่าจะแก้ไขหลังจากการ Deploy รอบแรกผ่านไปแล้ว เพื่อไม่ให้กระทบกำหนดการ',
      evening: 'Nattapon (PM) สรุปกำหนดการนัดซ้อมนำเสนอเดโมงานจริงวันพรุ่งนี้เวลา 10:00 น. และย้ำเตือนให้ทุกคนตรวจสอบความเรียบร้อยของหน้าเว็บสำหรับเตรียมแสดงผลจริง',
    },
    actionItems: [
      { id: 'act_01', task: 'แก้ไข CSS Layout หน้า Dashboard สำหรับ iPad Pro และดันโค้ดเข้า git', assignee: 'Thanya (Dev)', status: 'completed', dueDate: 'วันนี้, 12:00' },
      { id: 'act_02', task: 'เตรียมสไลด์และเนื้อหาการพรีเซนต์เดโมระบบสำหรับผู้บริหาร', assignee: 'Nattapon (PM)', status: 'pending', dueDate: 'พรุ่งนี้, 09:30' },
      { id: 'act_03', task: 'เขียน Test Case สำหรับระบบกรองข้อมูลวันที่ที่พบบั๊ก', assignee: 'Kittisak (QA)', status: 'pending', dueDate: '08 มิ.ย. 2569' },
      { id: 'act_04', task: 'ตรวจสอบ Mockup ล่าสุดของหน้ารายงานผลลัพธ์', assignee: 'Somsak (UX)', status: 'pending', dueDate: 'วันนี้, 18:00' },
    ],
    topics: [
      {
        name: 'Deployment to Staging',
        category: 'work',
        relevance: 95,
        keyPoints: [
          'ตกลง Deploy โค้ดเวอร์ชัน 1.2.0 ไปยังเซิร์ฟเวอร์จำลองเพื่อทดสอบรวมระบบ',
          'เปิดสิทธิ์การเข้าถึงให้ฝ่ายการตลาดเข้ามาลองใช้งานระบบค่ำวันนี้',
        ],
      },
      {
        name: 'UI / CSS Bugs (iPad)',
        category: 'urgent',
        relevance: 88,
        keyPoints: [
          'ปัญหา Layout ซ้อนทับกันเมื่อเปลี่ยนหน้าจอเป็นแนวตั้ง',
          'ได้รับการแก้ไขแล้วโดยทีม Front-end และ Deploy ทันที',
        ],
      },
      {
        name: 'Demo Preparation',
        category: 'general',
        relevance: 75,
        keyPoints: [
          'การจัดคิวและลำดับผู้พูดในงานเดโมวันจันทร์นี้',
          'กำหนดซ้อมรันคิวแบบ End-to-End เวลา 10:00 น. พรุ่งนี้',
        ],
      },
    ],
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
  },
  {
    id: 'grp_02',
    name: 'Sales & Marketing Sync',
    avatarColor: 'bg-rose-500 text-white',
    unreadCount: 0,
    lastActive: '12:15',
    membersCount: 8,
    syncStatus: 'completed',
    lastSynced: '2 ชั่วโมงที่แล้ว',
    stats: {
      messagesToday: 95,
      messagesChange: -10,
      activeContributorsCount: 4,
      sentiment: 'Mixed',
      sentimentScore: 61,
    },
    contributors: [
      { name: 'Kanya (Sales)', messagesCount: 35, avatarColor: 'bg-purple-500' },
      { name: 'Vichai (Mkt)', messagesCount: 30, avatarColor: 'bg-emerald-500' },
      { name: 'Prasert (VP)', messagesCount: 20, avatarColor: 'bg-amber-500' },
      { name: 'Sarah (Admin)', messagesCount: 10, avatarColor: 'bg-sky-500' },
    ],
    summary: {
      overall: 'การคุยเน้นเรื่องยอดขายประจำเดือนพฤษภาคมที่ต่ำกว่าเป้าเล็กน้อย และการจัดทำโปรโมชัน Mid-Year Sale ที่ต้องรีบสรุปเพื่อเตรียมทำแบนเนอร์โฆษณาในสัปดาห์หน้า',
      morning: 'Kanya เสนอรายงานยอดขายและคาดการณ์ยอดสั่งซื้อของไตรมาสที่ 2 โดยมีประเด็นเรื่องลูกค้ารายใหญ่ในเขตอุตสาหกรรมชะลอการสั่งซื้อ',
      afternoon: 'ทีมตกลงรายละเอียดกิจกรรมโปรโมชัน ลด 15% สำหรับสินค้ากลุ่มไอที และแถมของพรีเมียมเมื่อซื้อครบ 5,000 บาท โดยจะจัดแคมเปญ 15-25 มิถุนายนนี้',
      evening: 'ไม่มีการคุยที่มีนัยสำคัญ มีเพียงการส่งข้อมูลไฟล์ตัวอย่างโบรชัวร์โฆษณาจากฝ่ายกราฟิกมาเพื่อให้พิจารณารูปแบบเบื้องต้น',
    },
    actionItems: [
      { id: 'act_05', task: 'สรุปเงื่อนไขและสินค้าเข้าร่วม Mid-Year Sale ส่งให้ฝ่ายจัดซื้อเคาะราคาต้นทุน', assignee: 'Kanya (Sales)', status: 'pending', dueDate: '08 มิ.ย. 2569' },
      { id: 'act_06', task: 'ส่ง Brief ออกแบบแบนเนอร์หลัก 3 ขนาด ให้กราฟิกดีไซเนอร์', assignee: 'Vichai (Mkt)', status: 'completed', dueDate: 'วันนี้, 15:30' },
      { id: 'act_07', task: 'ติดต่อลูกค้ารายใหญ่ (Client X) เพื่อเจรจาสัญญาซื้อขายระยะยาวเพิ่มส่วนลดพิเศษ', assignee: 'Prasert (VP)', status: 'pending', dueDate: '12 มิ.ย. 2569' },
    ],
    topics: [
      {
        name: 'Mid-Year Sale Campaign',
        category: 'finance',
        relevance: 92,
        keyPoints: [
          'เป้าหมายยอดขายแคมเปญนี้อยู่ที่ 1.5 ล้านบาท',
          'งบประมาณโปรโมตโพสต์โซเชียลมีเดีย 15,000 บาท',
        ],
      },
      {
        name: 'Client X Renewal Delay',
        category: 'urgent',
        relevance: 85,
        keyPoints: [
          'ลูกค้าติดปัญหาเรื่องการปรับงบประมาณภายในองค์กร',
          'คู่แข่งเสนอราคาที่ถูกกว่า 5% ต้องทำการนัดคุยแบบส่วนตัวเพื่อเสนอข้อตกลงพิเศษ',
        ],
      },
    ],
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
  },
  {
    id: 'grp_03',
    name: 'ประสานงานลูกค้า (SCG Project)',
    avatarColor: 'bg-blue-500 text-white',
    unreadCount: 15,
    lastActive: '15:52',
    membersCount: 6,
    syncStatus: 'idle',
    lastSynced: 'ยังไม่เคยซิงค์ข้อมูลวันนี้',
    stats: {
      messagesToday: 42,
      messagesChange: 5,
      activeContributorsCount: 3,
      sentiment: 'Neutral',
      sentimentScore: 50,
    },
    contributors: [
      { name: 'Client Contact', messagesCount: 25, avatarColor: 'bg-yellow-600' },
      { name: 'Thanya (Dev)', messagesCount: 12, avatarColor: 'bg-indigo-500' },
      { name: 'Nattapon (PM)', messagesCount: 5, avatarColor: 'bg-rose-500' },
    ],
    summary: {
      overall: 'ยังไม่ได้ทำการวิเคราะห์สรุปข้อมูลล่าสุดของวันนี้ เนื่องจากระบบยังไม่ได้เชื่อมต่อดึงข้อมูล กรุณากดปุ่ม Sync ข้อมูลด้านบนเพื่อเริ่มต้นสรุปรายงาน',
      morning: '-',
      afternoon: '-',
      evening: '-',
    },
    actionItems: [],
    topics: [],
    hourlyActivity: [0, 0, 0, 0, 0, 0, 0, 0, 4, 12, 8, 3, 0, 2, 5, 8, 0, 0, 0, 0, 0, 0, 0, 0],
    rawChat: `[LINE Chat Log] ประสานงานลูกค้า (SCG Project)
[09:05] Client Contact: สวัสดีครับทีมงาน วันนี้ทางไอทีของ SCG ได้ส่งคู่มือสำหรับเชื่อมต่อ API Endpoint ชุดทดสอบมาให้ทางเมลแล้วนะครับ รบกวนประสานงานกับเดฟให้หน่อยครับ
[09:15] Nattapon (PM): ขอบคุณครับ ได้รับเมลแล้วครับ เดี๋ยวประสานต่อให้ Thanya ดำเนินการตั้งค่าทดสอบให้ครับ
[09:45] Thanya (Dev): ได้รับข้อมูล API แล้วครับ กำลังนำกุญแจเชื่อมต่อและ Endpoint ไปเซ็ตอัปบน Server ฝั่งเราครับ
[11:30] Thanya (Dev): ตอนนี้ทดสอบยิง API ไปฝั่ง SCG มีปัญหาดึงข้อมูลใบสั่งซื้อบางรายการแล้วได้ Error 500 กลับมาครับ กำลังเช็ค Log อยู่
[13:30] Client Contact: ทางเราเช็คระบบหลังบ้านแล้วพบว่าน่าจะเกิดจาก Date Format ครับ ทางระบบ SCG บังคับส่งวันที่ในฟอร์แมต ISO-8601 (YYYY-MM-DD) เท่านั้นครับ
[13:40] Thanya (Dev): อ้อ จริงด้วยครับ ฝั่งเราส่งไปเป็น DD-MM-YYYY เดี๋ยวผมขอแก้ฟังก์ชันการแปลง Format วันที่ให้รองรับรูปแบบนี้ก่อนครับ น่าจะแก้ไขและทดสอบยิงใหม่ได้ภายในบ่ายนี้ครับ
[15:10] Thanya (Dev): แก้ไขเรียบร้อยและลองรันเชื่อมต่อใหม่ไป 10 รอบ ได้ผลลัพธ์ผ่าน 100% แล้วครับ สรุปดึงข้อมูลเข้าสู่ระบบจำลองได้เรียบร้อยครับ
[15:40] Nattapon (PM): เยี่ยมเลยครับคุณ Thanya เดี๋ยวผมจะรวบรวมข้อมูลสรุปผลการทดสอบการเชื่อมต่อ (API Integration Report) ส่งไปให้ทาง PM ฝั่ง SCG ช่วยรีวิวก่อนเที่ยงวันพรุ่งนี้นะครับ
[15:45] Client Contact: ยอดเยี่ยมเลยครับ สะดวกรวดเร็วมาก ถ้าเอกสารผ่านแล้ว สัปดาห์หน้าเรานัดประชุมสรุปงานเฟสแรกกันต่อนะครับ ขอบคุณทีมงานมากครับ`,
  },
];

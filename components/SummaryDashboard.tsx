"use client";

import React, { useState, useEffect } from "react";
import { LineGroup } from "../lib/MockData";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Smile,
  CheckCircle,
  FileText,
  ListTodo,
  Hash,
  Clock,
  User,
  Coffee,
  Sun,
  Moon,
  BarChart2,
  Award,
  ArrowUpRight
} from "lucide-react";

interface SummaryDashboardProps {
  group: LineGroup;
  onSync: (groupId: string) => void;
  onToggleActionItem: (groupId: string, itemId: string) => void;
}

type TabType = "summary" | "actions" | "topics";

export function SummaryDashboard({
  group,
  onSync,
  onToggleActionItem,
}: SummaryDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("summary");

  // Reset tab to summary when group changes
  useEffect(() => {
    setActiveTab("summary");
  }, [group.id]);

  const isSyncing = group.syncStatus === "syncing";
  const isIdle = group.syncStatus === "idle";
  const isFailed = group.syncStatus === "failed";

  // Calculate stats
  const pendingActionsCount = group.actionItems.filter((i) => i.status === "pending").length;
  const completedActionsCount = group.actionItems.filter((i) => i.status === "completed").length;
  const totalActionsCount = group.actionItems.length;

  // Sentiment icon/color mapping
  const getSentimentDetails = (sentiment: string) => {
    switch (sentiment) {
      case "Positive":
        return { color: "text-emerald-600 bg-emerald-50", border: "border-emerald-100", text: "เชิงบวก (Positive)" };
      case "Neutral":
        return { color: "text-sky-600 bg-sky-50", border: "border-sky-100", text: "ทั่วไป (Neutral)" };
      case "Mixed":
        return { color: "text-amber-600 bg-amber-50", border: "border-amber-100", text: "ผสมผสาน (Mixed)" };
      case "Negative":
        return { color: "text-rose-600 bg-rose-50", border: "border-rose-100", text: "เชิงลบ (Negative)" };
      default:
        return { color: "text-zinc-600 bg-zinc-50", border: "border-zinc-100", text: "ไม่ระบุ" };
    }
  };

  const sentimentDetails = getSentimentDetails(group.stats.sentiment);

  // Custom visual CSS bar chart calculation
  const maxActivity = Math.max(...group.hourlyActivity, 1);

  return (
    <div className="flex-1 bg-zinc-50/50 overflow-y-auto flex flex-col h-full text-zinc-800">
      {/* Dashboard Header */}
      <header className="px-8 py-5 border-b border-zinc-200/80 bg-white/70 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight leading-none">{group.name}</h1>
            <span className="px-2.5 py-1 text-[10px] font-extrabold bg-zinc-100 text-zinc-500 rounded-full border border-zinc-200 uppercase tracking-wider select-none">
              ID: {group.id}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1.5 font-semibold">
            ซิงค์ล่าสุด: <span className="text-zinc-600 font-bold">{group.lastSynced}</span>
          </p>
        </div>

        <button
          onClick={() => onSync(group.id)}
          disabled={isSyncing}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl shadow-xs transition-all duration-300 select-none cursor-pointer ${
            isSyncing
              ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-600/10 active:scale-[0.98]"
          }`}
        >
          <RefreshCw className={`size-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "กำลังวิเคราะห์แชท..." : "Sync & สรุปข้อมูล"}
        </button>
      </header>

      {/* Main Content Scrollable Container */}
      <div className="p-8 space-y-8 flex-1">
        {isFailed ? (
          /* Failed/Error State */
          <div className="flex flex-col items-center justify-center py-12 bg-rose-50/50 border border-rose-200/60 rounded-3xl p-8 text-center max-w-2xl mx-auto mt-8 shadow-xs">
            <div className="size-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5 border border-rose-100 shadow-xs">
              <RefreshCw className="size-8" />
            </div>
            <h2 className="text-xl font-bold text-rose-800">การวิเคราะห์และสรุปผลผิดพลาด</h2>
            <p className="text-sm text-zinc-650 mt-2.5 max-w-md leading-relaxed font-semibold">
              {group.syncError || "เกิดข้อผิดพลาดในการเชื่อมต่อหรือวิเคราะห์ข้อมูลจาก Gemini API"}
            </p>
            <div className="mt-6 p-5 bg-white border border-zinc-200 rounded-2xl text-xs text-zinc-500 max-w-md text-left shadow-xs space-y-2">
              <p className="font-bold text-zinc-700">คำแนะนำการแก้ไข:</p>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>เปิดเมนู <strong>"สถานะและบันทึกระบบ"</strong> ที่แท็บแถบข้าง (Sidebar) ด้านล่างสุด</li>
                <li>ไปที่แท็บ <strong>"การตั้งค่า API"</strong> เพื่อกรอก GEMINI_API_KEY ของคุณ</li>
                <li>กดปุ่มบันทึกเพื่ออัปเดต และย้อนกลับมากดซิงค์ข้อมูลใหม่อีกครั้ง</li>
              </ol>
            </div>
            <button
              onClick={() => onSync(group.id)}
              className="mt-6 px-6 py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-sm shadow-emerald-600/10 cursor-pointer"
            >
              ลองซิงค์ใหม่อีกครั้ง
            </button>
          </div>
        ) : isIdle ? (
          /* Empty/Idle State */
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-zinc-200 rounded-3xl p-8 text-center max-w-2xl mx-auto mt-8 shadow-xs">
            <div className="size-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 border border-emerald-100 shadow-xs animate-pulse">
              <RefreshCw className="size-8" />
            </div>
            <h2 className="text-xl font-bold text-zinc-800">ยังไม่มีสรุปข้อมูลของวันนี้</h2>
            <p className="text-sm text-zinc-500 mt-2.5 max-w-md leading-relaxed font-medium">
              แชทของกลุ่ม "{group.name}" ยังไม่ได้รับการดึงข้อมูลและทำรายงานสรุปประจำวัน
            </p>
            <button
              onClick={() => onSync(group.id)}
              className="mt-6 px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-sm shadow-emerald-600/10 cursor-pointer"
            >
              เริ่มต้นซิงค์ข้อมูลสรุปทันที
            </button>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Messages Count */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">ข้อความวันนี้</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                    <FileText className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{group.stats.messagesToday}</h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold">
                    {group.stats.messagesChange >= 0 ? (
                      <span className="flex items-center text-emerald-650 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        <TrendingUp className="size-3 mr-0.5" /> +{group.stats.messagesChange}%
                      </span>
                    ) : (
                      <span className="flex items-center text-rose-650 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                        <TrendingDown className="size-3 mr-0.5" /> {group.stats.messagesChange}%
                      </span>
                    )}
                    <span className="text-zinc-400">เทียบกับเมื่อวาน</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Contributors */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">สมาชิกส่งแชท</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50">
                    <User className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-black text-zinc-900 tracking-tight">
                    {group.stats.activeContributorsCount} <span className="text-lg font-bold text-zinc-400">/ {group.membersCount}</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-2 font-semibold">คน ที่พูดคุยกันภายในกลุ่มวันนี้</p>
                </div>
              </div>

              {/* Card 3: Sentiment Index */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">บรรยากาศการสนทนา</span>
                  <div className={`p-2 rounded-xl border ${sentimentDetails.color} ${sentimentDetails.border}`}>
                    <Smile className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-black text-zinc-800 tracking-tight">{sentimentDetails.text}</h3>
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-zinc-450 mb-1 font-bold">
                      <span>ดัชนีเชิงบวก</span>
                      <span className="text-emerald-650">{group.stats.sentimentScore}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/40 p-0.5">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${group.stats.sentimentScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Action Items Progress */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">งานค้างอยู่ (Todos)</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/50">
                    <CheckCircle className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{pendingActionsCount}</h3>
                  <div className="flex justify-between text-[11px] text-zinc-400 mt-2 font-semibold">
                    <span>ทำเสร็จ {completedActionsCount}/{totalActionsCount} งาน</span>
                    <span className="font-bold text-zinc-600">{totalActionsCount > 0 ? Math.round((completedActionsCount / totalActionsCount) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Summary Tabs Center (Takes 2 cols) */}
              <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-2xl flex flex-col overflow-hidden shadow-xs">
                {/* Tab Header Navigation */}
                <div className="flex border-b border-zinc-200 bg-zinc-50/60 p-3 items-center justify-between">
                  <div className="flex bg-zinc-200/60 p-1 rounded-xl gap-1 select-none border border-zinc-200/20">
                    <button
                      onClick={() => setActiveTab("summary")}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                        activeTab === "summary"
                          ? "bg-white text-emerald-700 shadow-xs border border-zinc-300/30"
                          : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      <FileText className="size-3.5" />
                      สรุปตามเวลา
                    </button>

                    <button
                      onClick={() => setActiveTab("actions")}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 relative cursor-pointer ${
                        activeTab === "actions"
                          ? "bg-white text-emerald-700 shadow-xs border border-zinc-300/30"
                          : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      <ListTodo className="size-3.5" />
                      งานที่ต้องทำ
                      {pendingActionsCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-extrabold text-white shadow-xs">
                          {pendingActionsCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab("topics")}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                        activeTab === "topics"
                          ? "bg-white text-emerald-700 shadow-xs border border-zinc-300/30"
                          : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      <Hash className="size-3.5" />
                      ประเด็นสำคัญ
                    </button>
                  </div>
                </div>

                {/* Tab Content area */}
                <div className="p-8 min-h-[400px]">
                  {/* Tab 1: AI Summaries */}
                  {activeTab === "summary" && (
                    <div className="space-y-8">
                      {/* Overall Summary Banner */}
                      <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500" />
                        <h4 className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest flex items-center gap-2 mb-2 select-none">
                          <CheckCircle className="size-3.5" /> บทวิเคราะห์ภาพรวมประจำวัน
                        </h4>
                        <p className="text-sm leading-relaxed text-zinc-700 font-semibold">{group.summary.overall}</p>
                      </div>

                      {/* Chronological Timeline */}
                      <div className="relative border-l-2 border-zinc-150 pl-8 ml-4 space-y-8 py-2">
                        {/* Morning */}
                        <div className="relative group/timeline">
                          <div className="absolute -left-[41px] top-1 size-6 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center text-amber-600 shadow-xs group-hover/timeline:scale-110 transition-all duration-300">
                            <Coffee className="size-3" />
                          </div>
                          <div>
                            <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200 select-none">
                              ช่วงเช้า (08:00 - 12:00)
                            </span>
                            <p className="text-sm text-zinc-650 mt-2 leading-relaxed font-semibold">
                              {group.summary.morning}
                            </p>
                          </div>
                        </div>

                        {/* Afternoon */}
                        <div className="relative group/timeline">
                          <div className="absolute -left-[41px] top-1 size-6 rounded-full bg-sky-50 border-2 border-sky-400 flex items-center justify-center text-sky-600 shadow-xs group-hover/timeline:scale-110 transition-all duration-300">
                            <Sun className="size-3" />
                          </div>
                          <div>
                            <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200 select-none">
                              ช่วงบ่าย (12:00 - 17:00)
                            </span>
                            <p className="text-sm text-zinc-650 mt-2 leading-relaxed font-semibold">
                              {group.summary.afternoon}
                            </p>
                          </div>
                        </div>

                        {/* Evening */}
                        <div className="relative group/timeline">
                          <div className="absolute -left-[41px] top-1 size-6 rounded-full bg-indigo-50 border-2 border-indigo-400 flex items-center justify-center text-indigo-600 shadow-xs group-hover/timeline:scale-110 transition-all duration-300">
                            <Moon className="size-3" />
                          </div>
                          <div>
                            <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200 select-none">
                              ช่วงเย็น/ค่ำ (17:00 เป็นต้นไป)
                            </span>
                            <p className="text-sm text-zinc-650 mt-2 leading-relaxed font-semibold">
                              {group.summary.evening}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Action Items */}
                  {activeTab === "actions" && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-150 select-none">
                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">ทำเครื่องหมายหน้างานเมื่อทำงานเสร็จสิ้น</p>
                        <span className="text-[10px] text-zinc-600 font-extrabold bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200">
                          งานที่ค้าง: {pendingActionsCount}
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                        {group.actionItems.map((item) => (
                          <div
                            key={item.id}
                            className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all duration-300 ${
                              item.status === "completed"
                                ? "bg-zinc-50/70 border-zinc-200/80 opacity-60 text-zinc-400"
                                : "bg-white border-zinc-200/80 hover:border-zinc-300 hover:shadow-xs text-zinc-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={item.status === "completed"}
                              onChange={() => onToggleActionItem(group.id, item.id)}
                              className="mt-1 size-4 rounded-lg border-zinc-300 bg-white text-emerald-600 accent-emerald-600 cursor-pointer focus:ring-0 focus:ring-offset-0 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-relaxed font-bold ${item.status === "completed" ? "line-through text-zinc-400" : "text-zinc-800"}`}>
                                {item.task}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2.5 items-center text-[11px] text-zinc-450 font-bold select-none">
                                <span className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-zinc-600">
                                  <User className="size-3 text-zinc-450" />
                                  ผู้รับผิดชอบ: {item.assignee}
                                </span>
                                {item.dueDate && (
                                  <span className="flex items-center gap-1 bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded text-zinc-500">
                                    <Clock className="size-3 text-zinc-400" />
                                    กำหนดส่ง: {item.dueDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {group.actionItems.length === 0 && (
                          <div className="text-center py-16 text-zinc-400 text-sm flex flex-col items-center gap-2">
                            <ListTodo className="size-9 text-zinc-300" />
                            <span className="font-bold">ไม่พบงานมอบหมายจากการวิเคราะห์กลุ่มแชทนี้</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Topic Explorer */}
                  {activeTab === "topics" && (
                    <div className="space-y-5">
                      {group.topics.map((topic, index) => {
                        const getCategoryPill = (cat: string) => {
                          switch (cat) {
                            case "urgent":
                              return "bg-rose-50 text-rose-600 border-rose-100";
                            case "finance":
                              return "bg-amber-50 text-amber-600 border-amber-100";
                            case "work":
                              return "bg-indigo-50 text-indigo-600 border-indigo-100";
                            case "social":
                              return "bg-purple-50 text-purple-600 border-purple-100";
                            default:
                              return "bg-zinc-100 text-zinc-600 border-zinc-200";
                          }
                        };
                        return (
                          <div
                            key={index}
                            className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50/10 hover:border-zinc-250 hover:shadow-xs transition-all duration-300"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2 select-none">
                              <div className="flex items-center gap-2.5">
                                <span className="flex items-center justify-center size-6.5 rounded-lg bg-zinc-100 text-[11px] font-extrabold text-zinc-500 border border-zinc-200/50">
                                  #{index + 1}
                                </span>
                                <h4 className="text-sm font-black text-zinc-800">{topic.name}</h4>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-0.5 text-[9px] font-bold border rounded-full uppercase tracking-wider ${getCategoryPill(topic.category)}`}>
                                  {topic.category}
                                </span>
                                <span className="text-[11px] font-bold text-zinc-450">ความสำคัญ: {topic.relevance}%</span>
                              </div>
                            </div>

                            {/* Progress bar representing relevance */}
                            <div className="w-full h-1.5 bg-zinc-100 rounded-full mt-4 overflow-hidden border border-zinc-200/30 p-0.5">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${topic.category === "urgent" ? "bg-rose-500" : "bg-emerald-500"}`}
                                style={{ width: `${topic.relevance}%` }}
                              />
                            </div>

                            {/* Key points bullets */}
                            <ul className="mt-4.5 space-y-2.5 pl-2">
                              {topic.keyPoints.map((point, pIdx) => (
                                <li key={pIdx} className="text-sm text-zinc-600 flex items-start gap-2.5 leading-relaxed font-semibold">
                                  <span className="size-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}

                      {group.topics.length === 0 && (
                        <div className="text-center py-16 text-zinc-400 text-sm flex flex-col items-center gap-2">
                          <Hash className="size-9 text-zinc-300" />
                          <span className="font-bold">ไม่พบหัวข้อหลักจากการวิเคราะห์กลุ่มแชทนี้</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Analytics & Top Active Users (Takes 1 col) */}
              <div className="space-y-6">
                {/* CSS Activity Bar Chart Card */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs">
                  <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-4 select-none">
                    <BarChart2 className="size-4 text-emerald-600" /> ปริมาณแชทใน 24 ชม.
                  </h4>

                  {/* CSS Visual Bar Chart */}
                  <div className="h-36 flex items-end justify-between gap-1 pt-4 pb-2 border-b border-zinc-150">
                    {group.hourlyActivity.map((val, idx) => {
                      const barHeightPercent = Math.max((val / maxActivity) * 100, 4);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                          {/* Tooltip */}
                          <span className="absolute bottom-full mb-1 bg-zinc-950 text-zinc-100 text-[9px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 whitespace-nowrap shadow-md translate-y-1 group-hover:translate-y-0 border border-zinc-850">
                            {idx}:00 - {val} ข้อความ
                          </span>
                          {/* Bar */}
                          <div
                            style={{ height: `${barHeightPercent}%` }}
                            className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 via-emerald-450 to-teal-400 group-hover:from-emerald-600 group-hover:to-teal-500 hover:scale-x-110 active:scale-95 transition-all duration-200 cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart X-axis Labels */}
                  <div className="flex justify-between text-[9px] text-zinc-400 px-1 mt-2.5 font-bold uppercase tracking-wider select-none">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>23:00</span>
                  </div>
                </div>

                {/* Top Contributors Card */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs">
                  <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-4 select-none">
                    <Award className="size-4 text-emerald-600" /> สมาชิกคุยเยอะสูงสุด
                  </h4>

                  <div className="space-y-3">
                    {group.contributors.map((user, idx) => {
                      // Custom rank badge details
                      const getRankBadge = (rank: number) => {
                        switch (rank) {
                          case 1:
                            return "bg-amber-100 text-amber-800 border-amber-200 shadow-xs";
                          case 2:
                            return "bg-zinc-150 text-zinc-700 border-zinc-300/40 shadow-xs";
                          case 3:
                            return "bg-orange-100 text-orange-800 border-orange-200 shadow-xs";
                          default:
                            return "bg-zinc-100 text-zinc-500 border-zinc-200/50";
                        }
                      };

                      return (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white border border-zinc-100 hover:border-zinc-200 hover:-translate-y-0.5 transition-all duration-300">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Rank Badge */}
                            <span className={`size-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold border select-none ${getRankBadge(idx + 1)}`}>
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-zinc-800 truncate">{user.name}</h5>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-zinc-650 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                            {user.messagesCount}
                            <span className="text-[9px] font-normal text-zinc-450">แชท</span>
                          </span>
                        </div>
                      );
                    })}

                    {group.contributors.length === 0 && (
                      <div className="text-center py-6 text-zinc-400 text-xs font-semibold">
                        ยังไม่มีข้อมูลวิเคราะห์บุคคล
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

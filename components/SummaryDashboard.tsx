"use client";

import React, { useState, useEffect } from "react";
import { LineGroup, ActionItem } from "../lib/MockData";
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
  BarChart2
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
    <div className="flex-1 bg-zinc-50 overflow-y-auto flex flex-col h-full text-zinc-800">
      {/* Dashboard Header */}
      <header className="p-6 border-b border-zinc-200 bg-white flex items-center justify-between sticky top-0 backdrop-blur-md z-20 shadow-sm/50">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-zinc-900">{group.name}</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 text-zinc-600 rounded-full border border-zinc-200">
              ID: {group.id}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            ซิงค์ล่าสุด: <span className="text-zinc-600 font-medium">{group.lastSynced}</span>
          </p>
        </div>

        <button
          onClick={() => onSync(group.id)}
          disabled={isSyncing}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-all duration-300 ${
            isSyncing
              ? "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 shadow-sm shadow-emerald-600/10"
          }`}
        >
          <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "กำลังวิเคราะห์แชท..." : "Sync & สรุปข้อมูล"}
        </button>
      </header>

      {/* Main Content Scrollable Container */}
      <div className="p-6 space-y-6 flex-1">
        {isFailed ? (
          /* Failed/Error State */
          <div className="flex flex-col items-center justify-center py-10 bg-rose-50/50 border border-rose-200 rounded-2xl p-8 text-center max-w-2xl mx-auto mt-8 shadow-sm">
            <div className="size-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
              <RefreshCw className="size-8" />
            </div>
            <h2 className="text-lg font-bold text-rose-800">การวิเคราะห์และสรุปผลผิดพลาด</h2>
            <p className="text-sm text-zinc-600 mt-2 max-w-md">
              {group.syncError || "เกิดข้อผิดพลาดในการเชื่อมต่อหรือวิเคราะห์ข้อมูลจาก Gemini API"}
            </p>
            <div className="mt-6 p-4 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-500 max-w-md text-left shadow-sm">
              <p className="font-bold mb-1.5 text-zinc-700">วิธีแก้ไข:</p>
              <ol className="list-decimal list-inside space-y-1.5 leading-5">
                <li>เปิดไฟล์ <code className="bg-zinc-100 border border-zinc-200 px-1 py-0.5 rounded font-mono text-[10px]">.env.local</code> ในโฟลเดอร์โปรเจกต์</li>
                <li>ตั้งค่าตัวแปร <code className="bg-zinc-100 border border-zinc-200 px-1 py-0.5 rounded font-mono text-[10px]">GEMINI_API_KEY=API_KEY_จริงของคุณ</code></li>
                <li>รีสตาร์ทเซิร์ฟเวอร์รันระบบใหม่ (<code className="bg-zinc-100 border border-zinc-200 px-1 py-0.5 rounded font-mono text-[10px]">npm run dev</code>)</li>
                <li>กดปุ่มซิงค์ข้อมูลใหม่อีกครั้ง</li>
              </ol>
            </div>
            <button
              onClick={() => onSync(group.id)}
              className="mt-6 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/10"
            >
              ลองซิงค์ใหม่อีกครั้ง
            </button>
          </div>
        ) : isIdle ? (
          /* Empty/Idle State */
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-zinc-200 rounded-2xl p-8 text-center max-w-2xl mx-auto mt-8 shadow-sm">
            <div className="size-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100 animate-pulse">
              <RefreshCw className="size-8" />
            </div>
            <h2 className="text-lg font-bold text-zinc-800">ยังไม่มีสรุปข้อมูลของวันนี้</h2>
            <p className="text-sm text-zinc-500 mt-2 max-w-md">
              แชทของกลุ่ม "{group.name}" ยังไม่ได้รับการซิงค์ข้อมูลประจำวัน กรุณากดปุ่ม Sync ข้อมูลด้านบนเพื่อดึงข้อมูลและให้ AI ทำการจัดกลุ่มข้อความ สรุป และคัดแยกงานมอบหมายทันที
            </p>
            <button
              onClick={() => onSync(group.id)}
              className="mt-6 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/10"
            >
              เริ่มต้นซิงค์ข้อมูล
            </button>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Messages Count */}
              <div className="bg-white border border-zinc-200/80 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-zinc-300 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">ข้อความวันนี้</span>
                  <div className="p-1.5 rounded-lg bg-zinc-50 text-zinc-500 border border-zinc-100">
                    <FileText className="size-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold text-zinc-900">{group.stats.messagesToday}</h3>
                  <div className="flex items-center gap-1 mt-1 text-[11px]">
                    {group.stats.messagesChange >= 0 ? (
                      <span className="flex items-center text-emerald-600 font-bold">
                        <TrendingUp className="size-3 mr-0.5" /> +{group.stats.messagesChange}%
                      </span>
                    ) : (
                      <span className="flex items-center text-rose-600 font-bold">
                        <TrendingDown className="size-3 mr-0.5" /> {group.stats.messagesChange}%
                      </span>
                    )}
                    <span className="text-zinc-400">เปรียบเทียบกับเมื่อวาน</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Contributors */}
              <div className="bg-white border border-zinc-200/80 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-zinc-300 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">สมาชิกที่แอคทีฟ</span>
                  <div className="p-1.5 rounded-lg bg-zinc-50 text-zinc-500 border border-zinc-100">
                    <User className="size-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold text-zinc-900">{group.stats.activeContributorsCount} / {group.membersCount}</h3>
                  <p className="text-[11px] text-zinc-400 mt-1">คน ที่ส่งข้อความในวันนี้</p>
                </div>
              </div>

              {/* Card 3: Sentiment Index */}
              <div className="bg-white border border-zinc-200/80 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-zinc-300 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">บรรยากาศการคุย</span>
                  <div className={`p-1.5 rounded-lg ${sentimentDetails.color}`}>
                    <Smile className="size-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-base font-bold text-zinc-800">{sentimentDetails.text}</h3>
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>ดัชนีบวก</span>
                      <span className="text-emerald-600 font-bold">{group.stats.sentimentScore}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${group.stats.sentimentScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Action Items Progress */}
              <div className="bg-white border border-zinc-200/80 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-zinc-300 transition-all duration-300">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">งานที่เหลืออยู่</span>
                  <div className="p-1.5 rounded-lg bg-zinc-50 text-zinc-500 border border-zinc-100">
                    <CheckCircle className="size-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold text-zinc-900">{pendingActionsCount}</h3>
                  <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
                    <span>สำเร็จแล้ว {completedActionsCount}/{totalActionsCount} งาน</span>
                    <span className="font-semibold text-zinc-600">{totalActionsCount > 0 ? Math.round((completedActionsCount / totalActionsCount) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Summary Tabs Center (Takes 2 cols) */}
              <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                {/* Tab Header Navigation */}
                <div className="flex border-b border-zinc-200 bg-zinc-50 p-2 gap-1">
                  <button
                    onClick={() => setActiveTab("summary")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                      activeTab === "summary"
                        ? "bg-white text-emerald-700 shadow-sm border border-zinc-200"
                        : "text-zinc-500 hover:bg-zinc-200/40 hover:text-zinc-800"
                    }`}
                  >
                    <FileText className="size-4" />
                    สรุปตามเวลา
                  </button>

                  <button
                    onClick={() => setActiveTab("actions")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 relative ${
                      activeTab === "actions"
                        ? "bg-white text-emerald-700 shadow-sm border border-zinc-200"
                        : "text-zinc-500 hover:bg-zinc-200/40 hover:text-zinc-800"
                    }`}
                  >
                    <ListTodo className="size-4" />
                    งานที่ต้องทำ (Action Items)
                    {pendingActionsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-bounce">
                        {pendingActionsCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab("topics")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                      activeTab === "topics"
                        ? "bg-white text-emerald-700 shadow-sm border border-zinc-200"
                        : "text-zinc-500 hover:bg-zinc-200/40 hover:text-zinc-800"
                    }`}
                  >
                    <Hash className="size-4" />
                    ประเด็นหลัก (Topics)
                  </button>
                </div>

                {/* Tab Content area */}
                <div className="p-6 min-h-[350px]">
                  {/* Tab 1: AI Summaries */}
                  {activeTab === "summary" && (
                    <div className="space-y-6">
                      {/* Overall Summary Banner */}
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                          <CheckCircle className="size-3.5" /> ภาพรวมประจำวัน
                        </h4>
                        <p className="text-sm leading-6 text-zinc-700">{group.summary.overall}</p>
                      </div>

                      {/* Time-based Summary list */}
                      <div className="space-y-4">
                        {/* Morning */}
                        <div className="flex gap-4 group">
                          <div className="flex flex-col items-center shrink-0">
                            <div className="size-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                              <Coffee className="size-4" />
                            </div>
                            <div className="w-0.5 flex-1 bg-zinc-200 group-last:bg-transparent mt-2" />
                          </div>
                          <div className="pb-4 flex-1">
                            <h5 className="text-xs font-bold text-zinc-400 uppercase">ช่วงเช้า (08:00 - 12:00)</h5>
                            <p className="text-sm text-zinc-600 mt-1 leading-6">{group.summary.morning}</p>
                          </div>
                        </div>

                        {/* Afternoon */}
                        <div className="flex gap-4 group">
                          <div className="flex flex-col items-center shrink-0">
                            <div className="size-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
                              <Sun className="size-4" />
                            </div>
                            <div className="w-0.5 flex-1 bg-zinc-200 group-last:bg-transparent mt-2" />
                          </div>
                          <div className="pb-4 flex-1">
                            <h5 className="text-xs font-bold text-zinc-400 uppercase">ช่วงบ่าย (12:00 - 17:00)</h5>
                            <p className="text-sm text-zinc-600 mt-1 leading-6">{group.summary.afternoon}</p>
                          </div>
                        </div>

                        {/* Evening */}
                        <div className="flex gap-4 group">
                          <div className="flex flex-col items-center shrink-0">
                            <div className="size-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                              <Moon className="size-4" />
                            </div>
                            <div className="w-0.5 flex-1 bg-zinc-200 group-last:bg-transparent mt-2" />
                          </div>
                          <div className="pb-2 flex-1">
                            <h5 className="text-xs font-bold text-zinc-400 uppercase">ช่วงเย็น/ค่ำ (17:00 เป็นต้นไป)</h5>
                            <p className="text-sm text-zinc-600 mt-1 leading-6">{group.summary.evening}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Action Items */}
                  {activeTab === "actions" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                        <p className="text-xs text-zinc-400 font-medium">ทำเครื่องหมายงานเมื่อทำเสร็จเพื่อติดตามสถานะ</p>
                        <span className="text-xs text-zinc-600 font-bold bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                          ค้างคา: {pendingActionsCount}
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                        {group.actionItems.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all duration-300 ${
                              item.status === "completed"
                                ? "bg-zinc-50 border-zinc-200 opacity-60 text-zinc-400"
                                : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700 shadow-sm"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={item.status === "completed"}
                              onChange={() => onToggleActionItem(group.id, item.id)}
                              className="mt-1 size-4 rounded border-zinc-300 bg-white text-emerald-600 accent-emerald-600 cursor-pointer focus:ring-0 focus:ring-offset-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-5 font-semibold ${item.status === "completed" ? "line-through text-zinc-400" : "text-zinc-800"}`}>
                                {item.task}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2 items-center text-[10px] text-zinc-400">
                                <span className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded font-bold text-zinc-600">
                                  <User className="size-2.5" />
                                  {item.assignee}
                                </span>
                                {item.dueDate && (
                                  <span className="flex items-center gap-1 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100">
                                    <Clock className="size-2.5" />
                                    เดดไลน์: {item.dueDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {group.actionItems.length === 0 && (
                          <div className="text-center py-12 text-zinc-400 text-sm flex flex-col items-center gap-2">
                            <ListTodo className="size-8 text-zinc-300" />
                            <span>ไม่พบงานมอบหมายจากการวิเคราะห์กลุ่มแชทนี้</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Topic Explorer */}
                  {activeTab === "topics" && (
                    <div className="space-y-4">
                      {group.topics.map((topic, index) => {
                        // Category pill styling
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
                            className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/20 hover:border-zinc-300 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="flex items-center justify-center size-6 rounded-lg bg-zinc-200 text-[11px] font-bold text-zinc-600">
                                  #{index + 1}
                                </span>
                                <h4 className="text-sm font-bold text-zinc-800">{topic.name}</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full uppercase tracking-wider ${getCategoryPill(topic.category)}`}>
                                  {topic.category}
                                </span>
                                <span className="text-[10px] text-zinc-400">ความสำคัญ: {topic.relevance}%</span>
                              </div>
                            </div>

                            {/* Progress bar representing relevance */}
                            <div className="w-full h-1 bg-zinc-200 rounded-full mt-3 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${topic.category === "urgent" ? "bg-rose-500" : "bg-emerald-500"}`}
                                style={{ width: `${topic.relevance}%` }}
                              />
                            </div>

                            {/* Key points bullets */}
                            <ul className="mt-3.5 space-y-1.5 pl-2.5">
                              {topic.keyPoints.map((point, pIdx) => (
                                <li key={pIdx} className="text-xs text-zinc-500 flex items-start gap-2 leading-5">
                                  <span className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}

                      {group.topics.length === 0 && (
                        <div className="text-center py-12 text-zinc-400 text-sm flex flex-col items-center gap-2">
                          <Hash className="size-8 text-zinc-300" />
                          <span>ไม่พบหัวข้อหลักจากการวิเคราะห์กลุ่มแชทนี้</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Analytics & Top Active Users (Takes 1 col) */}
              <div className="space-y-6">
                {/* CSS Activity Bar Chart Card */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <BarChart2 className="size-4 text-emerald-600" /> ปริมาณแชทใน 24 ชม.
                  </h4>

                  {/* CSS Visual Bar Chart */}
                  <div className="h-32 flex items-end justify-between gap-1 pt-4 pb-2 border-b border-zinc-200">
                    {group.hourlyActivity.map((val, idx) => {
                      const barHeightPercent = Math.max((val / maxActivity) * 100, 3);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                          {/* Tooltip */}
                          <span className="absolute bottom-full mb-1 bg-zinc-900 text-zinc-100 text-[9px] font-semibold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap shadow-md">
                            {idx}:00 - {val} ข้อความ
                          </span>
                          {/* Bar */}
                          <div
                            style={{ height: `${barHeightPercent}%` }}
                            className="w-full rounded-t-sm bg-gradient-to-t from-emerald-400 to-emerald-500 group-hover:from-emerald-500 group-hover:to-teal-400 transition-all duration-300 cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart X-axis Labels */}
                  <div className="flex justify-between text-[9px] text-zinc-400 px-1 mt-1 font-bold uppercase">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>23:00</span>
                  </div>
                </div>

                {/* Top Contributors Card */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <User className="size-4 text-emerald-600" /> คนส่งข้อความเยอะสุด
                  </h4>

                  <div className="space-y-3">
                    {group.contributors.map((user, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar representation */}
                          <div className={`size-8 rounded-lg ${user.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-inner shrink-0`}>
                            {user.name[0]}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-zinc-700 truncate">{user.name}</h5>
                            <p className="text-[10px] text-zinc-400 font-medium">อันดับที่ {idx + 1}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-zinc-500 shrink-0">
                          {user.messagesCount} ข้อความ
                        </span>
                      </div>
                    ))}

                    {group.contributors.length === 0 && (
                      <div className="text-center py-6 text-zinc-400 text-xs">
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

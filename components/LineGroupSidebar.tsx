"use client";

import React, { useState } from "react";
import { LineGroup } from "../lib/MockData";
import { Search, MessageSquare, Users, RefreshCw, CheckCircle, Clock } from "lucide-react";

interface LineGroupSidebarProps {
  groups: LineGroup[];
  selectedGroupId: string;
  onSelectGroup: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function LineGroupSidebar({
  groups,
  selectedGroupId,
  onSelectGroup,
  searchQuery,
  onSearchChange,
}: LineGroupSidebarProps) {
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-80 border-r border-zinc-200 bg-zinc-50 flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm shadow-emerald-500/10">
            <MessageSquare className="size-5 font-bold" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-800 tracking-wide">LINE Summarizer</h2>
            <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">AI Analytics</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="p-4 border-b border-zinc-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            placeholder="ค้นหากลุ่ม LINE..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      {/* List Header */}
      <div className="px-4 py-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider bg-zinc-50 sticky top-0 z-10">
        กลุ่มทั้งหมด ({filteredGroups.length})
      </div>

      {/* Group List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredGroups.map((group) => {
          const isSelected = group.id === selectedGroupId;
          return (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className={`w-full text-left p-3 rounded-xl flex gap-3 transition-all duration-200 hover:bg-zinc-200/40 group relative ${
                isSelected
                  ? "bg-emerald-50/70 border border-emerald-100 text-emerald-950 shadow-sm"
                  : "border border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {/* Left Color Indicator border */}
              {isSelected && (
                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-emerald-500" />
              )}

              {/* Group Avatar */}
              <div className={`size-10 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0 shadow-sm ${group.avatarColor}`}>
                {group.name.split(" ").slice(0, 2).map(w => w[0]).join("")}
              </div>

              {/* Group Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className={`text-xs font-semibold truncate transition-colors ${
                    isSelected ? "text-emerald-950" : "text-zinc-700 group-hover:text-zinc-900"
                  }`}>
                    {group.name}
                  </h3>
                  <span className="text-[10px] text-zinc-400 shrink-0">{group.lastActive}</span>
                </div>

                <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="size-3" />
                    <span>{group.membersCount} คน</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {group.syncStatus === "completed" && (
                      <CheckCircle className="size-3 text-emerald-500" />
                    )}
                    {group.syncStatus === "syncing" && (
                      <RefreshCw className="size-3 text-amber-500 animate-spin" />
                    )}
                    {group.syncStatus === "idle" && (
                      <Clock className="size-3 text-zinc-400" />
                    )}
                    <span className="text-[10px] truncate max-w-[80px] font-medium">
                      {group.syncStatus === "completed" ? "ซิงค์แล้ว" : group.syncStatus === "syncing" ? "กำลังดึงข้อมูล" : "ไม่ได้ซิงค์"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Unread count badge */}
              {group.unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow-sm shadow-emerald-500/20 animate-pulse">
                  {group.unreadCount}
                </span>
              )}
            </button>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="text-center py-8 text-zinc-400 text-xs">
            ไม่พบกลุ่มที่คุณต้องการค้นหา
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-zinc-200 bg-white text-[11px] text-zinc-400 flex flex-col gap-1">
        <div className="flex justify-between">
          <span>ความปลอดภัยของข้อมูล:</span>
          <span className="text-emerald-600 font-semibold">End-to-End SSL</span>
        </div>
        <div className="text-[10px] text-zinc-400">
          * ระบบจะสรุปข้อมูลย้อนหลัง 24 ชั่วโมงล่าสุดเท่านั้น
        </div>
      </div>
    </aside>
  );
}

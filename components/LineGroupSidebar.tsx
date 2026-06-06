"use client";

import React from "react";
import { LineGroup } from "../lib/MockData";
import { Search, MessageSquare, Users, RefreshCw, CheckCircle, Clock, Settings, Shield } from "lucide-react";

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
    <aside className="w-80 border-r border-zinc-900 bg-[#0a0b0d] flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-900 bg-[#0a0b0d] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <MessageSquare className="size-5 font-bold" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-wide leading-tight">LINE Summarizer</h2>
            <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider mt-0.5">AI Analytics Portal</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="p-4 border-b border-zinc-900 bg-[#0a0b0d]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <input
            type="text"
            placeholder="ค้นหากลุ่ม LINE..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-300"
          />
        </div>
      </div>

      {/* List Header */}
      <div className="px-5 py-3 text-xs text-zinc-500 font-bold uppercase tracking-widest bg-[#0a0b0d]/80 backdrop-blur-sm sticky top-0 z-10">
        กลุ่มทั้งหมด ({filteredGroups.length})
      </div>

      {/* Group List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar">
        {filteredGroups.map((group) => {
          const isSelected = group.id === selectedGroupId;
          return (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className={`w-full text-left p-3 rounded-xl flex gap-3 transition-all duration-200 group relative ${isSelected
                  ? "bg-emerald-950/20 border border-emerald-900/40 text-emerald-100 shadow-sm"
                  : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                }`}
            >
              {/* Left Active Glow Indicator */}
              {isSelected && (
                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-gradient-to-b from-emerald-400 to-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.4)]" />
              )}

              {/* Group Avatar */}
              <div className={`size-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-inner ${group.avatarColor}`}>
                {group.name.split(" ").slice(0, 2).map(w => w[0]).join("")}
              </div>

              {/* Group Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className={`text-sm font-bold truncate transition-colors ${isSelected ? "text-emerald-50" : "text-zinc-350 group-hover:text-white"
                    }`}>
                    {group.name}
                  </h3>
                  <span className="text-[10px] text-zinc-500 shrink-0 font-medium">{group.lastActive}</span>
                </div>

                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <div className="flex items-center gap-1.5 text-zinc-550 group-hover:text-zinc-400 transition-colors">
                    <Users className="size-3" />
                    <span>{group.membersCount} คน</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {group.syncStatus === "completed" && (
                      <CheckCircle className="size-3 text-emerald-450" />
                    )}
                    {group.syncStatus === "syncing" && (
                      <RefreshCw className="size-3 text-amber-500 animate-spin" />
                    )}
                    {group.syncStatus === "idle" && (
                      <Clock className="size-3 text-zinc-500" />
                    )}
                    <span className={`text-[10px] font-semibold ${group.syncStatus === "completed" ? "text-emerald-400" : group.syncStatus === "syncing" ? "text-amber-400" : "text-zinc-500"
                      }`}>
                      {group.syncStatus === "completed" ? "ซิงค์แล้ว" : group.syncStatus === "syncing" ? "กำลังซิงค์" : "ไม่ได้ซิงค์"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Unread count badge */}
              {group.unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex size-4.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-extrabold text-white shadow-sm shadow-emerald-500/25 animate-pulse">
                  {group.unreadCount}
                </span>
              )}
            </button>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="text-center py-10 text-zinc-650 text-xs font-medium">
            ไม่พบกลุ่ม LINE ที่ต้องการค้นหา
          </div>
        )}
      </div>

      {/* Admin Panel Link */}
      <div className="px-3 py-3 border-t border-zinc-900 bg-[#0a0b0d] shrink-0">
        <button
          onClick={() => onSelectGroup("system_status")}
          className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-200 group relative ${selectedGroupId === "system_status"
              ? "bg-emerald-950/20 border border-emerald-900/40 text-emerald-100 shadow-sm"
              : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
            }`}
        >
          {selectedGroupId === "system_status" && (
            <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-gradient-to-b from-emerald-400 to-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.4)]" />
          )}
          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${selectedGroupId === "system_status" ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-zinc-900 text-zinc-400"
            }`}>
            <Settings className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-bold truncate transition-colors ${selectedGroupId === "system_status" ? "text-emerald-50" : "text-zinc-350 group-hover:text-white"
              }`}>
              สถานะและบันทึกระบบ
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5 truncate font-medium">ตั้งค่า Webhook, Env & System Logs</p>
          </div>
        </button>
      </div>

    </aside>
  );
}

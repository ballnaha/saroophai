"use client";

import React, { useState, useEffect } from "react";
import { LineGroup } from "@/lib/MockData";
import { LineGroupSidebar } from "@/components/LineGroupSidebar";
import { SummaryDashboard } from "@/components/SummaryDashboard";
import { SignOutButton } from "@/components/SignOutButton";
import { getLineGroups, toggleActionItemDb } from "@/app/actions/groups";
import { summarizeChat } from "@/app/actions/summarize";
import { RefreshCw, MessageSquare } from "lucide-react";

type DashboardAppProps = {
  userName?: string | null;
  userEmail?: string | null;
};

export function DashboardApp({ userName, userEmail }: DashboardAppProps) {
  const [groups, setGroups] = useState<LineGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGroups() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getLineGroups();
        if (res.success && res.data) {
          setGroups(res.data);
          if (res.data.length > 0) {
            setSelectedGroupId(res.data[0].id);
          }
        } else {
          setError(res.error || "เกิดข้อผิดพลาดในการโหลดข้อมูลกลุ่มแชท");
        }
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาดที่ไม่คาดคิด");
      } finally {
        setIsLoading(false);
      }
    }
    loadGroups();
  }, []);

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  const handleToggleActionItem = async (groupId: string, itemId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const item = group.actionItems.find((i) => i.id === itemId);
    if (!item) return;

    const nextStatus = item.status === "completed" ? "pending" : "completed";

    setGroups((prevGroups) =>
      prevGroups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          actionItems: g.actionItems.map((i) => {
            if (i.id !== itemId) return i;
            return { ...i, status: nextStatus };
          }),
        };
      })
    );

    try {
      const res = await toggleActionItemDb(itemId, nextStatus);
      if (!res.success) {
        setGroups((prevGroups) =>
          prevGroups.map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              actionItems: g.actionItems.map((i) => {
                if (i.id !== itemId) return i;
                return { ...i, status: item.status };
              }),
            };
          })
        );
        alert("ไม่สามารถบันทึกสถานะลงฐานข้อมูลได้: " + res.error);
      }
    } catch (err: any) {
      setGroups((prevGroups) =>
        prevGroups.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            actionItems: g.actionItems.map((i) => {
              if (i.id !== itemId) return i;
              return { ...i, status: item.status };
            }),
          };
        })
      );
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: " + err.message);
    }
  };

  const handleSyncGroup = async (groupId: string) => {
    const groupToSync = groups.find((g) => g.id === groupId);
    if (!groupToSync) return;

    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          syncStatus: "syncing",
          syncError: undefined,
        };
      })
    );

    try {
      await summarizeChat(groupId, groupToSync.rawChat);
      const fetchRes = await getLineGroups();
      if (fetchRes.success && fetchRes.data) {
        setGroups(fetchRes.data);
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      const fetchRes = await getLineGroups();
      if (fetchRes.success && fetchRes.data) {
        setGroups(fetchRes.data);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-zinc-50 font-sans text-zinc-500">
        <RefreshCw className="size-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-sm font-semibold">กำลังเชื่อมต่อฐานข้อมูล MySQL...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-zinc-50 font-sans p-6 text-center max-w-md mx-auto">
        <div className="size-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
          <MessageSquare className="size-8" />
        </div>
        <h2 className="text-lg font-bold text-zinc-800">เชื่อมต่อฐานข้อมูลล้มเหลว</h2>
        <p className="text-sm text-zinc-500 mt-2 leading-6">{error}</p>
        <div className="mt-6 p-4 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-500 text-left font-mono shadow-sm w-full">
          <p className="font-bold mb-1 text-zinc-700">คำแนะนำ:</p>
          <ul className="list-decimal list-inside space-y-1 text-[11px]">
            <li>ตรวจสอบว่า MySQL Server รันอยู่จริง</li>
            <li>ตรวจสอบตัวแปร <code className="bg-zinc-100 px-1 py-0.5 rounded">DATABASE_URL</code> ในไฟล์ <code className="bg-zinc-100 px-1 py-0.5 rounded">.env</code></li>
            <li>รันคำสั่ง <code className="bg-zinc-100 px-1 py-0.5 rounded">npx prisma db push</code> เพื่อจำลองตาราง</li>
          </ul>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/10"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-zinc-800 font-sans overflow-hidden">
      <LineGroupSidebar
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 shrink-0 border-b border-zinc-200 bg-white px-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-500">Signed in as</p>
            <p className="truncate text-sm font-bold text-zinc-800">
              {userName || userEmail || "Google user"}
            </p>
          </div>
          <SignOutButton />
        </header>

        {activeGroup ? (
          <SummaryDashboard
            group={activeGroup}
            onSync={handleSyncGroup}
            onToggleActionItem={handleToggleActionItem}
          />
        ) : (
          <div className="flex flex-col flex-1 items-center justify-center text-zinc-400">
            ไม่พบข้อมูลกลุ่มแชทในระบบ
          </div>
        )}
      </main>
    </div>
  );
}

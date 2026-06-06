"use client";

import React, { useState, useEffect } from "react";
import { LineGroup } from "@/lib/MockData";
import { LineGroupSidebar } from "@/components/LineGroupSidebar";
import { SummaryDashboard } from "@/components/SummaryDashboard";
import { SystemStatusDashboard } from "@/components/SystemStatusDashboard";
import { SignOutButton } from "@/components/SignOutButton";
import { getLineGroups, toggleActionItemDb } from "@/app/actions/groups";
import { summarizeChat } from "@/app/actions/summarize";
import { RefreshCw, MessageSquare, Menu } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const handleSelectGroup = (id: string) => {
    setSelectedGroupId(id);
    setIsMobileSidebarOpen(false);
  };

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
        toast.error("ไม่สามารถบันทึกสถานะลงฐานข้อมูลได้: " + res.error);
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
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: " + err.message);
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
      {/* Mobile Drawer Navigation Sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 border-none w-80 bg-[#0a0b0d]">
          <div className="sr-only">
            <h2>Navigation Drawer</h2>
            <p>Select a LINE group or configure status.</p>
          </div>
          <LineGroupSidebar
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={handleSelectGroup}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:flex shrink-0 h-full">
        <LineGroupSidebar
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={handleSelectGroup}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50">
        <header className="h-16 shrink-0 border-b border-zinc-200/80 bg-white/70 backdrop-blur-md px-6 flex items-center justify-between z-30">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-zinc-500 hover:bg-zinc-150 hover:text-zinc-800 active:scale-95 transition-all cursor-pointer"
              aria-label="Toggle sidebar"
            >
              <Menu className="size-5" />
            </button>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest min-w-0 select-none">
              <span>SaroopHai Portal</span>
              <span className="text-zinc-300">/</span>
              {selectedGroupId === "system_status" ? (
                <span className="text-zinc-650 font-extrabold truncate">สถานะและบันทึกระบบ</span>
              ) : activeGroup ? (
                <span className="text-zinc-700 font-extrabold truncate">{activeGroup.name}</span>
              ) : (
                <span className="text-zinc-600 font-extrabold truncate">แดชบอร์ด</span>
              )}
            </div>
          </div>

          {/* User Profile Info & Sign Out */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-150 px-3 py-1.5 rounded-xl select-none">
              <div className="size-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs shadow-inner">
                {userName ? userName[0].toUpperCase() : "U"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-zinc-800 leading-none truncate max-w-[120px]">
                  {userName || "Google User"}
                </p>
                <p className="text-[10px] text-zinc-455 font-semibold leading-none mt-1 truncate max-w-[120px]">
                  {userEmail || "user@email.com"}
                </p>
              </div>
            </div>
            <SignOutButton />
          </div>
        </header>

        {selectedGroupId === "system_status" ? (
          <SystemStatusDashboard />
        ) : activeGroup ? (
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

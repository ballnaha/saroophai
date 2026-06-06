"use client";

import React from "react";
import { LineGroup } from "../lib/MockData";
import {
  Avatar,
  Badge,
  Box,
  ButtonBase,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Tooltip,
  Popover,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  CheckCircle,
  Clock,
  MessageSquare,
  RefreshCw,
  Search,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface LineGroupSidebarProps {
  groups: LineGroup[];
  selectedGroupId: string;
  onSelectGroup: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function syncMeta(status: LineGroup["syncStatus"]) {
  if (status === "completed") {
    return { label: "ซิงค์แล้ว", color: "#34d399", icon: CheckCircle };
  }
  if (status === "syncing") {
    return { label: "กำลังซิงค์", color: "#f59e0b", icon: RefreshCw };
  }
  return { label: "ไม่ได้ซิงค์", color: "#71717a", icon: Clock };
}

function avatarColorToCss(color: string) {
  const legacyNamedColors: Record<string, string> = {
    amber: "#f59e0b",
    blue: "#3b82f6",
    emerald: "#10b981",
    indigo: "#6366f1",
    pink: "#ec4899",
    purple: "#a855f7",
    rose: "#f43f5e",
    sky: "#0ea5e9",
    teal: "#14b8a6",
    yellow: "#ca8a04",
  };

  if (color.startsWith("#") || color.startsWith("rgb") || color.startsWith("hsl")) {
    return color;
  }

  const legacyName = Object.keys(legacyNamedColors).find((name) => color.includes(name));
  return legacyNamedColors[legacyName ?? ""] ?? "#10b981";
}

export function LineGroupSidebar({
  groups,
  selectedGroupId,
  onSelectGroup,
  searchQuery,
  onSearchChange,
}: LineGroupSidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isGroupsExpanded, setIsGroupsExpanded] = React.useState(true);
  const [groupsAnchorEl, setGroupsAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const effectiveCollapsed = isCollapsed && isDesktop;

  React.useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newVal = !prev;
      localStorage.setItem("sidebar_collapsed", String(newVal));
      return newVal;
    });
  };

  const handleSearchClick = () => {
    setIsCollapsed(false);
    localStorage.setItem("sidebar_collapsed", "false");
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 250);
  };

  const handleGroupsClickCollapsed = (event: React.MouseEvent<HTMLButtonElement>) => {
    setGroupsAnchorEl(event.currentTarget);
  };

  const handleGroupsCloseCollapsed = () => {
    setGroupsAnchorEl(null);
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = groups.reduce((acc, group) => acc + group.unreadCount, 0);

  return (
    <Box
      component="aside"
      sx={{
        width: effectiveCollapsed ? 72 : 280,
        height: "100%",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: "#0a0b0d",
        borderRight: "1px solid #18181b",
        color: "#e4e4e7",
        userSelect: "none",
        transition: "width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
        overflowX: "hidden",
      }}
    >
      {/* Brand Header */}
      {effectiveCollapsed ? (
        <Box sx={{ p: 2, display: "flex", justifyContent: "center", borderBottom: "1px solid #18181b", minHeight: 73, alignItems: "center" }}>
          <Avatar sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: "#059669", boxShadow: "0 10px 20px rgba(5,150,105,0.2)" }}>
            <MessageSquare size={18} />
          </Avatar>
        </Box>
      ) : (
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: "1px solid #18181b",
            minHeight: 73,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
            <Avatar sx={{ width: 38, height: 38, borderRadius: 2.5, bgcolor: "#059669", boxShadow: "0 10px 20px rgba(5,150,105,0.2)" }}>
              <MessageSquare size={18} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 14, lineHeight: 1.1, fontWeight: 600, color: "#fff" }}>
                LINE Summarizer
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: 8.5, fontWeight: 500, letterSpacing: 0.8, color: "#34d399", textTransform: "uppercase" }}>
                AI Analytics Portal
              </Typography>
            </Box>
          </Stack>
        </Stack>
      )}

      {/* Search Section */}
      {effectiveCollapsed ? (
        <Box sx={{ p: 1.5, display: "flex", justifyContent: "center", borderBottom: "1px solid #18181b" }}>
          <Tooltip title="ค้นหากลุ่ม LINE" placement="right">
            <IconButton
              onClick={handleSearchClick}
              sx={{
                color: "#a1a1aa",
                borderRadius: 2.5,
                bgcolor: "rgba(24,24,27,0.78)",
                border: "1px solid #27272a",
                width: 40,
                height: 40,
                "&:hover": { bgcolor: "rgba(39,39,42,0.72)", color: "#fff", borderColor: "#3f3f46" },
              }}
            >
              <Search size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box sx={{ p: 1.5, borderBottom: "1px solid #18181b" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="ค้นหากลุ่ม LINE..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            inputRef={searchInputRef}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={15} color="#71717a" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: 36,
                borderRadius: 2.5,
                bgcolor: "rgba(24,24,27,0.78)",
                color: "#e4e4e7",
                fontSize: 13,
                fontWeight: 500,
                "& fieldset": { borderColor: "#27272a" },
                "&:hover fieldset": { borderColor: "#3f3f46" },
                "&.Mui-focused fieldset": { borderColor: "#10b981", borderWidth: 1 },
              },
              "& input::placeholder": { color: "#71717a", opacity: 1 },
            }}
          />
        </Box>
      )}

      {/* Navigation Groups Section */}
      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {effectiveCollapsed ? (
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Tooltip title="กลุ่มแชททั้งหมด" placement="right">
              <Badge
                invisible={totalUnread <= 0}
                badgeContent={totalUnread}
                color="success"
                sx={{ "& .MuiBadge-badge": { minWidth: 16, height: 16, fontSize: 9, fontWeight: 600, bgcolor: "#10b981" } }}
              >
                <IconButton
                  onClick={handleGroupsClickCollapsed}
                  sx={{
                    color: selectedGroupId !== "system_status" ? "#ecfdf5" : "#a1a1aa",
                    borderRadius: 2.5,
                    bgcolor: selectedGroupId !== "system_status" ? "rgba(6,78,59,0.26)" : "transparent",
                    border: selectedGroupId !== "system_status" ? "1px solid rgba(16,185,129,0.38)" : "1px solid transparent",
                    width: 44,
                    height: 44,
                    transition: "all 160ms ease",
                    "&:hover": {
                      bgcolor: selectedGroupId !== "system_status" ? "rgba(6,78,59,0.34)" : "rgba(39,39,42,0.6)",
                      color: "#f4f4f5",
                      borderColor: selectedGroupId !== "system_status" ? "rgba(16,185,129,0.5)" : "#27272a",
                    },
                  }}
                >
                  <MessageSquare size={20} />
                </IconButton>
              </Badge>
            </Tooltip>

            {/* Collapsed Submenu Popover */}
            <Popover
              open={Boolean(groupsAnchorEl)}
              anchorEl={groupsAnchorEl}
              onClose={handleGroupsCloseCollapsed}
              anchorOrigin={{
                vertical: "center",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "center",
                horizontal: "left",
              }}
              slotProps={{
                paper: {
                  sx: {
                    bgcolor: "#0a0b0d",
                    border: "1px solid #18181b",
                    borderRadius: 3,
                    width: 260,
                    maxHeight: 450,
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    p: 1,
                    ml: 1.5,
                  },
                },
              }}
            >
              <Typography sx={{ px: 1.5, py: 1, fontSize: 11, fontWeight: 600, color: "#d4d4d8", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #18181b", mb: 1 }}>
                กลุ่มแชททั้งหมด ({filteredGroups.length})
              </Typography>
              <Stack spacing={0.75} sx={{ overflowY: "auto", maxHeight: 380 }}>
                {filteredGroups.map((group) => (
                  <GroupButton
                    key={group.id}
                    group={group}
                    selected={group.id === selectedGroupId}
                    onClick={() => {
                      onSelectGroup(group.id);
                      handleGroupsCloseCollapsed();
                    }}
                  />
                ))}
                {filteredGroups.length === 0 && (
                  <Typography sx={{ py: 3, textAlign: "center", fontSize: 12, color: "#52525b" }}>
                    ไม่พบกลุ่ม LINE
                  </Typography>
                )}
              </Stack>
            </Popover>
          </Box>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {/* Expanded Submenu Header */}
            <ButtonBase
              onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.5,
                borderBottom: "1px solid rgba(24,24,27,0.65)",
                bgcolor: "rgba(10,11,13,0.84)",
                color: "#d4d4d8",
                "&:hover": { bgcolor: "rgba(24,24,27,0.9)" },
              }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                <MessageSquare size={16} color="#71717a" />
                <Box sx={{ textAlign: "left" }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                    กลุ่มแชท
                  </Typography>
                  <Typography sx={{ fontSize: 9, fontWeight: 500, color: "#52525b" }}>
                    LINE GROUPS
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={filteredGroups.length}
                  sx={{
                    height: 18,
                    minWidth: 26,
                    borderRadius: 999,
                    bgcolor: "rgba(24,24,27,0.88)",
                    border: "1px solid #27272a",
                    color: "#a1a1aa",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              </Stack>
              <ChevronDown
                size={16}
                style={{
                  transform: isGroupsExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 150ms ease",
                  color: "#71717a",
                }}
              />
            </ButtonBase>

            {isGroupsExpanded && (
              <Stack spacing={0.75} sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 1.25, py: 1.25 }}>
                {filteredGroups.map((group) => (
                  <GroupButton
                    key={group.id}
                    group={group}
                    selected={group.id === selectedGroupId}
                    onClick={() => onSelectGroup(group.id)}
                  />
                ))}

                {filteredGroups.length === 0 && (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#52525b" }}>ไม่พบกลุ่ม LINE ที่ต้องการค้นหา</Typography>
                  </Box>
                )}
              </Stack>
            )}
          </Box>
        )}
      </Box>

      {/* System Bottom Nav Menu */}
      <Box
        component="nav"
        aria-label="System menu"
        sx={{
          flexShrink: 0,
          p: 1.5,
          borderTop: "1px solid #18181b",
          bgcolor: "rgba(10,11,13,0.96)",
          boxShadow: "0 -18px 28px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          alignItems: "stretch",
        }}
      >
        {effectiveCollapsed ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
            <Tooltip title="สถานะและบันทึกระบบ" placement="right">
              <IconButton
                onClick={() => onSelectGroup("system_status")}
                sx={{
                  color: selectedGroupId === "system_status" ? "#ecfdf5" : "#a1a1aa",
                  borderRadius: 2.5,
                  bgcolor: selectedGroupId === "system_status" ? "rgba(6,78,59,0.26)" : "transparent",
                  border: selectedGroupId === "system_status" ? "1px solid rgba(16,185,129,0.38)" : "1px solid transparent",
                  width: 44,
                  height: 44,
                  transition: "all 160ms ease",
                  "&:hover": {
                    bgcolor: selectedGroupId === "system_status" ? "rgba(6,78,59,0.34)" : "rgba(39,39,42,0.6)",
                    color: "#f4f4f5",
                    borderColor: selectedGroupId === "system_status" ? "rgba(16,185,129,0.5)" : "#27272a",
                  },
                }}
              >
                <Settings size={20} />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <SidebarSectionHeader title="เมนูระบบ" description="Settings" compact />
            <SystemMenuButton
              selected={selectedGroupId === "system_status"}
              onClick={() => onSelectGroup("system_status")}
            />
          </Box>
        )}

        {/* Toggle Collapse Button (Desktop Only) */}
        <Box sx={{ display: { xs: "none", lg: "flex" }, justifyContent: effectiveCollapsed ? "center" : "flex-end" }}>
          <Tooltip title={effectiveCollapsed ? "ขยายแถบข้าง" : "ยุบแถบข้าง"} placement="right">
            <IconButton
              onClick={handleToggleCollapse}
              sx={{
                color: "#71717a",
                borderRadius: 2,
                width: 36,
                height: 36,
                border: "1px solid #18181b",
                bgcolor: "rgba(24,24,27,0.3)",
                "&:hover": { bgcolor: "rgba(39,39,42,0.5)", color: "#fff", borderColor: "#27272a" },
              }}
            >
              {effectiveCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}

function SidebarSectionHeader({
  title,
  description,
  count,
  compact = false,
}: {
  title: string;
  description: string;
  count?: number;
  compact?: boolean;
}) {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        px: compact ? 0.5 : 2,
        pt: compact ? 0 : 1.5,
        pb: compact ? 1 : 1.25,
        borderBottom: compact ? 0 : "1px solid rgba(24,24,27,0.65)",
        bgcolor: compact ? "transparent" : "rgba(10,11,13,0.84)",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.35, color: "#d4d4d8", textTransform: "uppercase" }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 0.2, fontSize: 9, fontWeight: 500, color: "#52525b" }}>
          {description}
        </Typography>
      </Box>
      {typeof count === "number" && (
        <Chip
          size="small"
          label={count}
          sx={{
            height: 20,
            minWidth: 30,
            borderRadius: 999,
            bgcolor: "rgba(24,24,27,0.88)",
            border: "1px solid #27272a",
            color: "#a1a1aa",
            fontSize: 10,
            fontWeight: 600,
          }}
        />
      )}
    </Stack>
  );
}

function SystemMenuButton({
  selected,
  onClick,
}: {
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        p: 1.15,
        borderRadius: 3,
        textAlign: "left",
        position: "relative",
        border: selected ? "1px solid rgba(16,185,129,0.38)" : "1px solid #18181b",
        bgcolor: selected ? "rgba(6,78,59,0.26)" : "rgba(24,24,27,0.5)",
        color: selected ? "#ecfdf5" : "#a1a1aa",
        transition: "all 160ms ease",
        "&:hover": { bgcolor: selected ? "rgba(6,78,59,0.34)" : "rgba(39,39,42,0.72)", color: "#f4f4f5" },
      }}
    >
      {selected && (
        <Box sx={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 4, borderRadius: "0 6px 6px 0", bgcolor: "#34d399" }} />
      )}
      <Avatar
        sx={{
          width: 32,
          height: 32,
          borderRadius: 2.5,
          bgcolor: selected ? "#10b981" : "#0f1115",
          border: selected ? "1px solid rgba(167,243,208,0.32)" : "1px solid #27272a",
          color: selected ? "#fff" : "#a1a1aa",
        }}
      >
        <Settings size={16} />
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: "inherit" }}>
          สถานะและบันทึกระบบ
        </Typography>
        <Typography noWrap sx={{ mt: 0.1, fontSize: 9, fontWeight: 400, color: selected ? "#86efac" : "#71717a" }}>
          Webhook, Env & System Logs
        </Typography>
      </Box>
    </ButtonBase>
  );
}

function GroupButton({
  group,
  selected,
  onClick,
}: {
  group: LineGroup;
  selected: boolean;
  onClick: () => void;
}) {
  const meta = syncMeta(group.syncStatus);
  const SyncIcon = meta.icon;

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        p: 1.15,
        borderRadius: 3,
        textAlign: "left",
        position: "relative",
        border: selected ? "1px solid rgba(16,185,129,0.32)" : "1px solid transparent",
        bgcolor: selected ? "rgba(6,78,59,0.24)" : "transparent",
        color: selected ? "#ecfdf5" : "#a1a1aa",
        transition: "all 160ms ease",
        "&:hover": { bgcolor: selected ? "rgba(6,78,59,0.3)" : "rgba(39,39,42,0.6)", color: "#f4f4f5" },
      }}
    >
      {selected && (
        <Box sx={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 4, borderRadius: "0 6px 6px 0", bgcolor: "#34d399", boxShadow: "0 0 14px rgba(52,211,153,0.34)" }} />
      )}

      <Badge
        invisible={group.unreadCount <= 0}
        badgeContent={group.unreadCount}
        color="success"
        sx={{ "& .MuiBadge-badge": { minWidth: 16, height: 16, fontSize: 9, fontWeight: 600, bgcolor: "#10b981" } }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2.5,
            fontSize: 11,
            fontWeight: 600,
            bgcolor: avatarColorToCss(group.avatarColor),
            color: "#fff",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          {initials(group.name)}
        </Avatar>
      </Badge>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: selected ? "#ecfdf5" : "inherit" }}>
            {group.name}
          </Typography>
          <Typography sx={{ fontSize: 9, fontWeight: 400, color: "#71717a", flexShrink: 0 }}>{group.lastActive}</Typography>
        </Stack>

        <Stack direction="row" sx={{ mt: 0.5, alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "#71717a" }}>
            <Users size={11} />
            <Typography sx={{ fontSize: 10, fontWeight: 400 }}>{group.membersCount} คน</Typography>
          </Stack>

          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: meta.color }}>
            <SyncIcon size={11} className={group.syncStatus === "syncing" ? "app-spin" : ""} />
            <Typography sx={{ fontSize: 9, fontWeight: 500 }}>{meta.label}</Typography>
          </Stack>
        </Stack>
      </Box>
    </ButtonBase>
  );
}

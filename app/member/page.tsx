import { requireMember } from "@/lib/authz";
import { SignOutButton } from "@/components/SignOutButton";
import { redirect } from "next/navigation";
import {
  Avatar,
  Box,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  Building2,
  CheckCircle2,
  Clock3,
  IdCard,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export default async function MemberPage() {
  let user;
  try {
    user = await requireMember();
  } catch {
    redirect("/auth/redirect");
  }

  const displayName = user.name || "Member";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "M";

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "#f6f8fb", color: "#09090b" }}>
      <Box component="header" sx={{ borderBottom: "1px solid #e4e4e7", bgcolor: "rgba(255,255,255,0.96)" }}>
        <Container maxWidth="lg">
          <Stack direction="row" sx={{ height: 68, alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
              <Avatar sx={{ width: 42, height: 42, bgcolor: "#059669", borderRadius: 3, boxShadow: "0 10px 22px rgba(5,150,105,0.18)" }}>
                <ShieldCheck size={21} />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: "#047857", textTransform: "uppercase" }}>
                  SaroopHai
                </Typography>
                <Typography noWrap sx={{ fontSize: { xs: 15, sm: 17 }, fontWeight: 950, color: "#09090b" }}>
                  Member Portal
                </Typography>
              </Box>
            </Stack>
            <SignOutButton />
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper
              elevation={0}
              sx={{
                overflow: "hidden",
                border: "1px solid #e4e4e7",
                borderRadius: 4,
                bgcolor: "#fff",
                boxShadow: "0 18px 50px rgba(24,24,27,0.06)",
              }}
            >
              <Box
                sx={{
                  p: { xs: 3, sm: 4 },
                  borderBottom: "1px solid #e4e4e7",
                  background:
                    "linear-gradient(110deg, rgba(236,253,245,1) 0%, rgba(255,255,255,1) 48%, rgba(239,246,255,1) 100%)",
                }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 3 }}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center", minWidth: 0 }}>
                    <Avatar
                      sx={{
                        width: 68,
                        height: 68,
                        borderRadius: 4,
                        bgcolor: "#fff",
                        color: "#047857",
                        border: "1px solid #a7f3d0",
                        fontSize: 22,
                        fontWeight: 950,
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Chip
                        icon={<CheckCircle2 size={15} />}
                        label="Login active"
                        size="small"
                        sx={{ mb: 1.25, bgcolor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontWeight: 900 }}
                      />
                      <Typography component="h1" sx={{ fontSize: { xs: 25, sm: 30 }, lineHeight: 1.2, fontWeight: 950, letterSpacing: 0 }}>
                        สวัสดี, {displayName}
                      </Typography>
                      <Typography sx={{ mt: 0.75, color: "#52525b", fontSize: 14, fontWeight: 600 }}>
                        บัญชีนี้เข้าสู่ระบบในฐานะ member
                      </Typography>
                    </Box>
                  </Stack>

                  <Paper elevation={0} sx={{ px: 2, py: 1.5, border: "1px solid #e4e4e7", borderRadius: 3, bgcolor: "#fff", minWidth: 160 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: "#a1a1aa", textTransform: "uppercase" }}>
                      Current Role
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.75, alignItems: "center" }}>
                      <LockKeyhole size={16} color="#059669" />
                      <Typography sx={{ fontSize: 14, fontWeight: 950, letterSpacing: 0.8, textTransform: "uppercase" }}>member</Typography>
                    </Stack>
                  </Paper>
                </Stack>
              </Box>

              <Grid container>
                <InfoTile icon={UserRound} label="ชื่อบัญชี" value={displayName} />
                <InfoTile icon={Mail} label="อีเมล" value={user.email || "-"} />
                <InfoTile icon={IdCard} label="ระดับสิทธิ์" value="Member only" />
              </Grid>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper elevation={0} sx={{ height: "100%", p: { xs: 2.5, sm: 3 }, border: "1px solid #e4e4e7", borderRadius: 4, bgcolor: "#fff" }}>
              <Stack direction="row" spacing={1.75} sx={{ alignItems: "flex-start" }}>
                <Avatar sx={{ width: 46, height: 46, bgcolor: "#09090b", borderRadius: 3 }}>
                  <LockKeyhole size={22} />
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 950 }}>จำกัดสิทธิ์การใช้งาน</Typography>
                  <Typography sx={{ mt: 1, color: "#52525b", fontSize: 14, lineHeight: 1.7, fontWeight: 600 }}>
                    หน้าจัดการระบบ, Dashboard, logs และข้อมูล admin ถูกเปิดให้เฉพาะ role admin เท่านั้น
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ mt: 3, p: 2, border: "1px solid #fde68a", bgcolor: "#fffbeb", borderRadius: 3 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 950, letterSpacing: 1, color: "#92400e", textTransform: "uppercase" }}>
                  Access note
                </Typography>
                <Typography sx={{ mt: 0.75, fontSize: 14, lineHeight: 1.7, fontWeight: 700, color: "#78350f" }}>
                  หากต้องใช้งาน Dashboard ให้แจ้งผู้ดูแลระบบเพื่อปรับ role ของบัญชีนี้เป็น admin
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, border: "1px solid #e4e4e7", borderRadius: 4, bgcolor: "#fff" }}>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 950, letterSpacing: 1, color: "#a1a1aa", textTransform: "uppercase" }}>
                    Status
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 20, fontWeight: 950 }}>สิทธิ์ของบัญชี</Typography>
                </Box>
                <Avatar sx={{ width: 42, height: 42, bgcolor: "#ecfdf5", color: "#047857", borderRadius: 3 }}>
                  <ShieldCheck size={21} />
                </Avatar>
              </Stack>
              <Divider sx={{ my: 2.5 }} />
              <Stack spacing={1.5}>
                <PermissionRow allowed icon={MessageCircle} label="เข้าสู่หน้า Member Portal" />
                <PermissionRow icon={Building2} label="เปิด Dashboard หลัก" />
                <PermissionRow icon={Clock3} label="รัน Daily Summary และจัดการ Logs" />
                <PermissionRow icon={LockKeyhole} label="แก้ไข API/System Settings" />
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 7 }}>
            <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, border: "1px solid #e4e4e7", borderRadius: 4, bgcolor: "#fff" }}>
              <Typography sx={{ fontSize: 11, fontWeight: 950, letterSpacing: 1, color: "#a1a1aa", textTransform: "uppercase" }}>
                Next step
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: 20, fontWeight: 950 }}>ขอสิทธิ์ Admin</Typography>
              <Grid container spacing={2} sx={{ mt: 1.5 }}>
                <Step number="01" title="แจ้งอีเมล" description={user.email || "อีเมลบัญชีนี้"} />
                <Step number="02" title="ผู้ดูแลตรวจสอบ" description="ยืนยันบริษัทและสิทธิ์ที่ต้องใช้" />
                <Step number="03" title="ปรับ role" description="เปลี่ยนเป็น admin แล้วเข้าสู่ Dashboard ได้" />
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Grid size={{ xs: 12, sm: 4 }} sx={{ borderTop: "1px solid #e4e4e7", borderRight: { sm: "1px solid #e4e4e7" }, "&:last-child": { borderRight: 0 } }}>
      <Box sx={{ p: 2.5, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "#a1a1aa" }}>
          <Icon size={16} color="#059669" />
          <Typography sx={{ fontSize: 11, fontWeight: 950, letterSpacing: 1, textTransform: "uppercase" }}>{label}</Typography>
        </Stack>
        <Typography noWrap sx={{ mt: 1, fontSize: 14, fontWeight: 850, color: "#18181b" }}>
          {value}
        </Typography>
      </Box>
    </Grid>
  );
}

function PermissionRow({
  icon: Icon,
  label,
  allowed = false,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  allowed?: boolean;
}) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #e4e4e7", borderRadius: 3, bgcolor: "#fafafa" }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
          <Icon size={17} color={allowed ? "#059669" : "#a1a1aa"} />
          <Typography noWrap sx={{ fontSize: 14, fontWeight: 800, color: "#27272a" }}>
            {label}
          </Typography>
        </Stack>
        <Chip
          size="small"
          label={allowed ? "allowed" : "locked"}
          sx={{
            height: 23,
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 950,
            letterSpacing: 0.7,
            textTransform: "uppercase",
            bgcolor: allowed ? "#ecfdf5" : "#fff",
            color: allowed ? "#047857" : "#a1a1aa",
            border: allowed ? "1px solid #a7f3d0" : "1px solid #e4e4e7",
          }}
        />
      </Stack>
    </Paper>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <Grid size={{ xs: 12, sm: 4 }}>
      <Paper elevation={0} sx={{ height: "100%", p: 2, border: "1px solid #e4e4e7", borderRadius: 3, bgcolor: "#fafafa" }}>
        <Typography sx={{ fontSize: 12, fontWeight: 950, color: "#047857" }}>{number}</Typography>
        <Typography sx={{ mt: 1, fontSize: 14, fontWeight: 950, color: "#09090b" }}>{title}</Typography>
        <Typography sx={{ mt: 0.75, fontSize: 12, lineHeight: 1.7, fontWeight: 600, color: "#71717a" }}>{description}</Typography>
      </Paper>
    </Grid>
  );
}

import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowRight,
  Building2,
  LineChart,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { LoginButton } from "@/components/LoginButton";

function GoogleIcon() {
  return (
    <Box component="svg" sx={{ width: 20, height: 20, flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Box>
  );
}

function LineLogo() {
  return (
    <Box sx={{ position: "relative", width: 20, height: 20, flexShrink: 0 }}>
      <Image src="/images/line_icon.png" alt="LINE Logo" fill sizes="20px" style={{ objectFit: "contain" }} />
    </Box>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const isAccessDenied = params?.error === "AccessDenied";

  if (session?.user?.role === "admin") {
    redirect("/");
  }

  if (session?.user?.role === "member") {
    redirect("/member");
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 18% -10%, rgba(255, 255, 255, 0.95), transparent 34%), radial-gradient(circle at 88% 4%, rgba(216, 229, 255, 0.64), transparent 30%), linear-gradient(180deg, #f8f9fb 0%, #eef1f5 100%)",
        color: "#1d1d1f",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Premium Neon Glowing Spots */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 15% 15%, rgba(0, 113, 227, 0.08), transparent 45%), radial-gradient(circle at 85% 85%, rgba(52, 199, 89, 0.08), transparent 45%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", py: 6 }}>
        <Box
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 430px" },
            gap: { xs: 6, lg: 8 },
            alignItems: "center",
          }}
        >
          {/* Left Panel (Marketing & Demo) */}
          <Stack spacing={4} sx={{ display: { xs: "none", lg: "flex" } }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: "#0071e3", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,113,227,0.16)" }}>
                <LineChart size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.1, color: "#1d1d1f" }}>
                  SaroopHai
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: 10, fontWeight: 500, letterSpacing: 1, color: "#0071e3", textTransform: "uppercase" }}>
                  LINE operations intelligence
                </Typography>
              </Box>
            </Stack>

            <Box>
              <Chip
                icon={<Sparkles size={14} color="#0071e3" />}
                label="AI Operations Intelligence"
                sx={{
                  bgcolor: "rgba(0,113,227,0.06)",
                  color: "#0071e3",
                  border: "1px solid rgba(0,113,227,0.12)",
                  fontWeight: 500,
                  borderRadius: 999,
                  fontSize: 12,
                  px: 0.5,
                }}
              />
              <Typography
                component="h1"
                sx={{
                  mt: 3,
                  maxWidth: 620,
                  fontSize: { lg: 40 },
                  lineHeight: 1.25,
                  fontWeight: 700,
                  color: "#1d1d1f",
                }}
              >
                สรุปงานจาก LINE ให้ทีมเห็นภาพเดียวกัน
              </Typography>
              <Typography sx={{ mt: 2, maxWidth: 560, color: "#6e6e73", fontSize: 15, lineHeight: 1.75, fontWeight: 400 }}>
                วิเคราะห์แชท สรุปประเด็น ดึง action items และติดตามงานผ่าน Dashboard กลางที่แยกข้อมูลตามบริษัทอย่างชัดเจน
              </Typography>
            </Box>

            {/* Glassmorphic Demo Preview Box */}
            <Paper
              elevation={0}
              sx={{
                maxWidth: 470,
                border: "1px solid rgba(0, 0, 0, 0.06)",
                borderRadius: "16px",
                overflow: "hidden",
                bgcolor: "rgba(255, 255, 255, 0.72)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* Header bar */}
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", px: 2.5, py: 1.5, borderBottom: "1px solid rgba(0, 0, 0, 0.06)" }}>
                <Stack direction="row" spacing={0.75}>
                  {["#ff5f56", "#ffbd2e", "#27c93f"].map((color) => (
                    <Box key={color} sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
                  ))}
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#34c759", boxShadow: "0 0 8px rgba(52,199,89,0.4)" }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#6e6e73" }}>Live Summary</Typography>
                </Stack>
              </Stack>
              <Box sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: "#0071e3", fontSize: 11, fontWeight: 600, color: "#fff" }}>สม</Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#1d1d1f" }}>สมยศ</Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 13, color: "#323235", bgcolor: "rgba(0, 0, 0, 0.03)", px: 1.5, py: 1, borderRadius: "8px", border: "1px solid rgba(0, 0, 0, 0.02)" }}>
                      เดี๋ยวผมเข้าพบซัพพลายเออร์ A สรุปราคาเหล็กบ่ายสองครึ่งครับ
                    </Typography>
                  </Box>
                </Stack>
                
                {/* AI Summary Box inside preview */}
                <Box sx={{ mt: 2.5, p: 2, border: "1px solid rgba(52, 199, 89, 0.2)", bgcolor: "rgba(52, 199, 89, 0.06)", borderRadius: "12px" }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Sparkles size={14} color="#24963e" />
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#24963e" }}>AI สรุปคำสั่งงาน</Typography>
                  </Stack>
                  <Typography sx={{ mt: 0.75, fontSize: 13, color: "#1d1d1f", lineHeight: 1.6 }}>
                    ประชุมสรุปราคาเหล็กกับซัพพลายเออร์ A วันนี้ 14:30 น.
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Stack direction="row" spacing={4} sx={{ color: "#6e6e73" }}>
              <Feature icon={ShieldCheck} label="Protected Session" />
              <Feature icon={MessageCircle} label="LINE Ready" />
              <Feature icon={Building2} label="Company Workspace" />
            </Stack>
          </Stack>

          {/* Right Panel (Login Card) */}
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              maxWidth: { xs: 460, lg: "none" },
              mx: "auto",
              p: { xs: 4, sm: 5 },
              borderRadius: "24px",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.05)",
              bgcolor: "rgba(255, 255, 255, 0.82)",
              backdropFilter: "blur(20px)",
            }}
          >
            <Stack spacing={3.5}>
              <Stack direction="row" spacing={1.5} sx={{ display: { xs: "flex", lg: "none" }, alignItems: "center" }}>
                <Avatar sx={{ width: 38, height: 38, bgcolor: "#0071e3", borderRadius: "10px", boxShadow: "0 8px 20px rgba(0,113,227,0.15)" }}>
                  <LineChart size={19} />
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 18, color: "#1d1d1f" }}>SaroopHai</Typography>
                  <Typography sx={{ fontSize: 9, fontWeight: 500, letterSpacing: 0.8, color: "#0071e3", textTransform: "uppercase" }}>
                    LINE operations intelligence
                  </Typography>
                </Box>
              </Stack>

              <Box>
                <Chip
                  label="Secure Access"
                  size="small"
                  sx={{
                    height: 22,
                    bgcolor: "rgba(0, 113, 227, 0.06)",
                    color: "#0071e3",
                    border: "1px solid rgba(0, 113, 227, 0.12)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    fontSize: 10,
                  }}
                />
                <Typography component="h2" sx={{ mt: 2, fontSize: { xs: 24, sm: 28 }, fontWeight: 600, lineHeight: 1.2, color: "#1d1d1f" }}>
                  เข้าสู่ระบบ
                </Typography>
                <Typography sx={{ mt: 1, color: "#6e6e73", fontSize: 13.5, lineHeight: 1.7, fontWeight: 400 }}>
                  หลังเข้าสู่ระบบ ระบบจะส่งคุณไปยังหน้าที่ตรงกับบทบาทของคุณโดยอัตโนมัติ
                </Typography>
              </Box>

              {isAccessDenied && (
                <Alert
                  severity="warning"
                  icon={<ShieldCheck size={20} />}
                  sx={{
                    borderRadius: "12px",
                    border: "1px solid rgba(217, 119, 6, 0.3)",
                    bgcolor: "rgba(217, 119, 6, 0.08)",
                    color: "#d97706",
                    "& .MuiAlert-icon": { color: "#d97706" },
                    "& .MuiAlert-message": { fontWeight: 600, fontSize: 13 },
                  }}
                >
                  บัญชีนี้ยังไม่มีสิทธิ์สำหรับหน้าที่ร้องขอ กรุณาติดต่อผู้ดูแลระบบ
                </Alert>
              )}

              <Stack spacing={2}>
                <Box
                  component="form"
                  action={async () => {
                    "use server";
                    await signIn("line", { redirectTo: "/auth/redirect" });
                  }}
                >
                  <LoginButton
                    variant="contained"
                    provider="line"
                    startIcon={<LineLogo />}
                    endIcon={<ArrowRight size={18} />}
                    label="Continue with LINE Login"
                    sx={{
                      bgcolor: "#06C755",
                      color: "#fff",
                      boxShadow: "0 8px 20px rgba(6,199,85,0.12)",
                      "&:hover": {
                        bgcolor: "#05b64d",
                        boxShadow: "0 12px 28px rgba(6,199,85,0.22)",
                        transform: "translateY(-1px)",
                      },
                    }}
                  />
                </Box>

                <Box
                  component="form"
                  action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/auth/redirect" });
                  }}
                >
                  <LoginButton
                    variant="outlined"
                    provider="google"
                    startIcon={<GoogleIcon />}
                    endIcon={<ArrowRight size={18} />}
                    label="Continue with Google"
                    sx={{
                      color: "#1d1d1f",
                      borderColor: "rgba(0, 0, 0, 0.12)",
                      bgcolor: "rgba(255, 255, 255, 0.72)",
                      "&:hover": {
                        borderColor: "rgba(0, 0, 0, 0.2)",
                        bgcolor: "rgba(0, 0, 0, 0.03)",
                        transform: "translateY(-1px)",
                      },
                      "& .MuiButton-endIcon": { color: "#86868b" },
                    }}
                  />
                </Box>
              </Stack>

              <Divider sx={{ borderColor: "rgba(0, 0, 0, 0.08)" }} />

              <Stack direction="row" spacing={1} sx={{ justifyContent: "center", alignItems: "center", color: "#86868b" }}>
                <LockKeyhole size={14} />
                <Typography sx={{ fontSize: 11.5, fontWeight: 500, letterSpacing: 0.5 }}>Secure Session Encrypted</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

function Feature({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number; color?: string }>; label: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Icon size={15} color="#0071e3" />
      <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#6e6e73" }}>{label}</Typography>
    </Stack>
  );
}
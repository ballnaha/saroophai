import type { Metadata } from "next";
import { Sarabun, Geist_Mono } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { MuiThemeProvider } from "./mui-theme-provider";
import "./globals.css";
import { Toaster } from "sonner";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LINE Summarizer Dashboard",
  description: "AI LINE Group Chat Summarizer Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} ${geistMono.variable}`}>
      <body>
        <AppRouterCacheProvider>
          <MuiThemeProvider>
            {children}
            <Toaster position="top-right" closeButton />
          </MuiThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

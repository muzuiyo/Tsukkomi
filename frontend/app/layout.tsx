import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/contexts/toastContext";
import { AuthProvider } from "@/contexts/authContext";
import ToastContainer from "@/components/toast/toastContainer";
import { ConfirmProvider } from "@/components/confirm";
import { Suspense } from "react";

const SITE_URL = "https://tsukkomi.lain.today";

export const viewport: Viewport = {
  themeColor: "#4a7cff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tsukkomi 备忘录",
    template: "%s | Tsukkomi",
  },
  description: "Tsukkomi 是一个简洁的卡片式笔记系统，支持 Markdown 编写、标签分类、公开/私有可见性控制，随时随地记录灵感与想法。",
  keywords: ["笔记", "备忘录", "memo", "笔记系统", "markdown", "卡片笔记"],
  authors: [{ name: "mao" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "Tsukkomi 备忘录",
    title: "Tsukkomi 备忘录",
    description: "简洁的卡片式笔记系统，支持 Markdown、标签分类、公开/私有可见性控制。",
  },
  twitter: {
    card: "summary",
    title: "Tsukkomi 备忘录",
    description: "简洁的卡片式笔记系统，支持 Markdown、标签分类、公开/私有可见性控制。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <Suspense>
          <AuthProvider>
            <ToastProvider>
              <ConfirmProvider>
                {children}
              </ConfirmProvider>
              <ToastContainer />
            </ToastProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/contexts/toastContext";
import { AuthProvider } from "@/contexts/authContext";
import ToastContainer from "@/components/toast/toastContainer";
import { ConfirmProvider } from "@/components/confirm";
import { Suspense } from "react";
export const metadata: Metadata = {
  title: "💬 Tsukkomi",
  description: "Tsukkomi 备忘录",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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

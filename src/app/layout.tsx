import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EcomPilot MVP",
    template: "%s | EcomPilot MVP",
  },
  description: "本地运行的个人电商商品评估与 AI 素材生成工作台骨架。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full font-sans text-foreground">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

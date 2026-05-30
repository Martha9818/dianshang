import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1780px] px-0 lg:px-3 lg:py-3">
        <AppSidebar />
        <main className="flex min-h-screen flex-1 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.98))] lg:min-h-[calc(100vh-24px)] lg:rounded-[34px] lg:border lg:border-white/80 lg:shadow-[0_28px_76px_rgba(53,77,118,0.08)]">
          <MobileNavigation />
          <div className="flex flex-1 flex-col">{children}</div>
        </main>
      </div>
    </div>
  );
}
